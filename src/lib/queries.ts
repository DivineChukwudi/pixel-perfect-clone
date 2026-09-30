import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProductRow } from "@/lib/products";

export type PromotionRow = {
  id: string;
  title_en: string;
  title_so: string;
  description_en: string;
  description_so: string;
  image_url: string | null;
  active: boolean;
};

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<ProductRow[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as ProductRow[];
  },
});

export const promotionsQuery = queryOptions({
  queryKey: ["promotions"],
  queryFn: async (): Promise<PromotionRow[]> => {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as PromotionRow[];
  },
});
