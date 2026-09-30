-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_so text NOT NULL,
  description_en text NOT NULL DEFAULT '',
  description_so text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  category text NOT NULL DEFAULT 'other',
  available boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Promotions
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_so text NOT NULL,
  description_en text NOT NULL DEFAULT '',
  description_so text NOT NULL DEFAULT '',
  image_url text,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Promotions are publicly readable" ON public.promotions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage promotions" ON public.promotions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE SEQUENCE public.order_number_seq START 1001;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('TM-' || nextval('public.order_number_seq')::text),
  customer_name text NOT NULL,
  phone text NOT NULL,
  order_type text NOT NULL DEFAULT 'takeaway',
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text,
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT USAGE ON SEQUENCE public.order_number_seq TO anon, authenticated, service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Recent orders readable for confirmation" ON public.orders FOR SELECT TO anon, authenticated
  USING (created_at > now() - interval '2 hours' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Recent orders updatable for payment" ON public.orders FOR UPDATE TO anon, authenticated
  USING (created_at > now() - interval '2 hours' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can add order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Order items readable with order" ON public.order_items FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.created_at > now() - interval '2 hours' OR public.has_role(auth.uid(), 'admin'))));

-- Feedback
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.feedback TO anon;
GRANT SELECT, INSERT ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can leave feedback" ON public.feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read feedback" ON public.feedback FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed products
INSERT INTO public.products (name_en, name_so, description_en, description_so, price, category, available, featured, sort_order) VALUES
('Fat Cakes', 'Makoenya', 'Golden, fluffy fried dough cakes made fresh every morning.', 'Makoenya a masetla, a besitsoeng hosasa ka hosasa.', 3.00, 'fat-cakes', true, true, 1),
('Russians', 'Ma-Russian', 'Juicy grilled russian sausage served hot off the plate.', 'Sosetjhe ea Russian e halikiloeng, e chesang.', 18.00, 'russians', true, true, 2),
('Chips', 'Chips', 'Crispy hand-cut chips, salted and seasoned to order.', 'Chips tse khahlang, tse nang le letsoai le tsepe.', 15.00, 'chips', true, true, 3),
('Fish', 'Tlhapi', 'Crispy fried fish fillet with a squeeze of lemon.', 'Tlhapi e halikiloeng e nang le lemon.', 25.00, 'fish', true, true, 4),
('Sliced Polony', 'Polony e Sehiloeng', 'Thick slices of polony, grilled or cold in a fresh roll.', 'Likhechana tse kholo tsa polony, tse halikiloeng kapa tse batang.', 10.00, 'polony', true, false, 5),
('Kota', 'Kota', 'Loaded quarter bread with chips, polony, russian and sauce.', 'Bohobe ba kotara bo tletse chips, polony, russian le sauce.', 30.00, 'kota', true, true, 6);

-- Seed promotions
INSERT INTO public.promotions (title_en, title_so, description_en, description_so, active) VALUES
('Buy 3, Get 1 Free', 'Reka 3, Fumana 1 Mahala', 'Buy any three Fat Cakes and get the fourth one free, all day every day.', 'Reka makoenya a mararo ebe o fumana la bone mahala, letsatsi lohle.', true),
('Kota Combo Special', 'Kota Combo e Khethehileng', 'Kota plus a cold drink for a single low price. Ask at the counter.', 'Kota le seno se batang ka theko e le ngoe e tlase.', true);