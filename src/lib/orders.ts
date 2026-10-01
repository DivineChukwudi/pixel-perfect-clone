import { supabase } from "@/integrations/supabase/client";

export type OrderType = "takeaway" | "eat_in" | "delivery";
export type PaymentMethodDb = "mpesa" | "ecocash" | "manual";

export type CreateOrderInput = {
  customerName: string;
  phone: string;
  orderType: OrderType;
  paymentMethod: PaymentMethodDb;
  deliveryAddress?: string;
  items: { productId: string; quantity: number }[];
};

export type CreatedOrder = { order_number: string; total: number; subtotal?: number; delivery_fee?: number };

type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

/**
 * Places an order through the create_order database function. Prices are read
 * from the products table on the server, so nothing the browser sends can
 * change what the customer is charged.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  const { data, error } = await (supabase as unknown as RpcClient).rpc("create_order", {
    _customer_name: input.customerName,
    _phone: input.phone,
    _order_type: input.orderType,
    _payment_method: input.paymentMethod,
    _items: input.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    _delivery_address: input.deliveryAddress ?? null,
  });
  if (error) throw new Error(error.message);
  return data as CreatedOrder;
}
