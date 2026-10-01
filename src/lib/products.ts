import kota from "@/assets/hero-kota.jpg";

export type ProductRow = {
  id: string;
  name_en: string;
  name_so: string;
  description_en: string;
  description_so: string;
  price: number;
  image_url: string | null;
  category: string;
  available: boolean;
  featured: boolean;
  is_special?: boolean;
  sort_order: number;
};

const categoryImages: Record<string, string> = {
  kota,
};

export const CATEGORIES = ["fat-cakes", "russians", "chips", "fish", "polony", "kota"] as const;

export function productImage(product: Pick<ProductRow, "image_url" | "category">) {
  if (product.image_url && product.image_url.trim() !== "") return product.image_url;
  return categoryImages[product.category] ?? kota;
}
