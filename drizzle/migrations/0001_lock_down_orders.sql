-- 1. Remove the open order policies and anon access
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
DROP POLICY IF EXISTS "Recent orders readable for confirmation" ON public.orders;
DROP POLICY IF EXISTS "Recent orders updatable for payment" ON public.orders;
DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can add order items" ON public.order_items;
DROP POLICY IF EXISTS "Order items readable with order" ON public.order_items;

REVOKE ALL ON public.orders, public.order_items FROM anon;
REVOKE USAGE ON SEQUENCE public.order_number_seq FROM anon, authenticated;

CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage order items" ON public.order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS notes text;

-- 2. Only active promotions are public
DROP POLICY IF EXISTS "Promotions are publicly readable" ON public.promotions;
CREATE POLICY "Active promotions are public" ON public.promotions FOR SELECT TO anon, authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

-- 3. Feedback validation
ALTER TABLE public.feedback
  ADD CONSTRAINT feedback_rating_range CHECK (rating BETWEEN 1 AND 5),
  ADD CONSTRAINT feedback_name_len CHECK (char_length(name) BETWEEN 1 AND 80),
  ADD CONSTRAINT feedback_message_len CHECK (char_length(message) <= 1000);

-- 4. Server-side order creation (prices come from the DB, never the browser)
CREATE OR REPLACE FUNCTION public.create_order(
  _customer_name text, _phone text, _order_type text, _payment_method text, _items jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _digits text;
  _order_id uuid;
  _order_number text;
  _total numeric := 0;
  _item jsonb;
  _qty int;
  _prod public.products%ROWTYPE;
BEGIN
  _customer_name := btrim(coalesce(_customer_name, ''));
  IF char_length(_customer_name) NOT BETWEEN 2 AND 80 THEN
    RAISE EXCEPTION 'Please enter a valid name';
  END IF;

  _digits := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
  IF _digits !~ '^(266)?[0-9]{8}$' THEN
    RAISE EXCEPTION 'Please enter a valid Lesotho phone number';
  END IF;
  _digits := right(_digits, 8);

  IF _order_type NOT IN ('takeaway', 'eat_in') THEN
    RAISE EXCEPTION 'Invalid order type';
  END IF;
  IF _payment_method NOT IN ('mpesa', 'ecocash', 'manual') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION 'Your buy list is empty or too large';
  END IF;

  INSERT INTO public.orders (customer_name, phone, order_type, payment_method, payment_status)
  VALUES (_customer_name, _digits, _order_type, _payment_method, 'awaiting_confirmation')
  RETURNING id, order_number INTO _order_id, _order_number;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := (_item->>'quantity')::int;
    IF _qty NOT BETWEEN 1 AND 50 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;
    SELECT * INTO _prod FROM public.products
      WHERE id = (_item->>'product_id')::uuid AND available = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'An item in your list is no longer available';
    END IF;
    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity)
    VALUES (_order_id, _prod.id, _prod.name_en, _prod.price, _qty);
    _total := _total + _prod.price * _qty;
  END LOOP;

  UPDATE public.orders SET total = _total WHERE id = _order_id;
  RETURN jsonb_build_object('order_number', _order_number, 'total', _total);
END $$;

-- 5. Customers can check only their own order (needs number AND phone)
CREATE OR REPLACE FUNCTION public.get_order_status(_order_number text, _phone text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('order_number', order_number, 'payment_status', payment_status,
                            'order_type', order_type, 'total', total, 'created_at', created_at)
  FROM public.orders
  WHERE order_number = _order_number
    AND phone = right(regexp_replace(coalesce(_phone, ''), '\D', '', 'g'), 8)
$$;

REVOKE EXECUTE ON FUNCTION public.create_order(text, text, text, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_order_status(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, text, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_status(text, text) TO anon, authenticated;