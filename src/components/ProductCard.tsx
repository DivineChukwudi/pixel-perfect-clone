import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { useCart } from "@/lib/cart";
import { formatMaloti } from "@/config/siteConfig";
import { productImage, type ProductRow } from "@/lib/products";

export function ProductCard({ product }: { product: ProductRow }) {
  const { t, pick } = useI18n();
  const { add, replaceWith } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const name = pick(product as unknown as Record<string, unknown>, "name");
  const description = pick(product as unknown as Record<string, unknown>, "description");
  const image = productImage(product);

  const cartItem = {
    productId: product.id,
    nameEn: product.name_en,
    nameSo: product.name_so,
    price: Number(product.price),
    image,
  };

  return (
    <article className="gold-frame fade-up flex flex-col overflow-hidden rounded-3xl">
      <div className="relative aspect-4/3 overflow-hidden">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
        {!product.available && (
          <span className="absolute top-3 left-3 rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground">
            {t("common.soldOut")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-display text-xl leading-tight">{name}</h3>
          <span className="shrink-0 font-display text-lg text-primary">
            {formatMaloti(Number(product.price))}
          </span>
        </div>
        <p className="flex-1 text-sm text-muted-foreground">{description}</p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-[var(--gold-soft)] p-1">
            <button
              type="button"
              aria-label={t("common.quantity")}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid h-7 w-7 cursor-pointer place-items-center rounded-full text-primary hover:bg-accent"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
            <button
              type="button"
              aria-label={t("common.quantity")}
              onClick={() => setQuantity((value) => value + 1)}
              className="grid h-7 w-7 cursor-pointer place-items-center rounded-full text-primary hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button
            variant="gold"
            className="flex-1 rounded-full"
            disabled={!product.available}
            onClick={() => {
              add(cartItem, quantity);
              toast.success(t("common.added"));
            }}
          >
            {t("common.addToBuyList")}
          </Button>
        </div>

        <Button
          variant="goldOutline"
          size="sm"
          className="rounded-full"
          disabled={!product.available}
          onClick={() => {
            replaceWith(cartItem, quantity);
            navigate({ to: "/checkout" });
          }}
        >
          {t("common.buyNow")}
        </Button>
      </div>
    </article>
  );
}
