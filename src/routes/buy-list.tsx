import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { useCart } from "@/lib/cart";
import { loadCustomer, saveCustomer } from "@/lib/customer";
import type { OrderType } from "@/lib/orders";
import { formatMaloti } from "@/config/siteConfig";

export const Route = createFileRoute("/buy-list")({
  head: () => ({ meta: [{ title: "Buy List — T&M Lunch" }] }),
  component: BuyListPage,
});

function BuyListPage() {
  const { t, lang } = useI18n();
  const { items, total, setQuantity, remove } = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("takeaway");

  useEffect(() => {
    const saved = loadCustomer();
    setName(saved.name);
    setPhone(saved.phone);
    setOrderType(saved.orderType);
  }, []);

  if (items.length === 0) {
    return (
      <div className="section-shell flex flex-col items-center gap-5 py-24 text-center">
        <h1 className="text-3xl">{t("buy.title")}</h1>
        <p className="text-muted-foreground">{t("buy.empty")}</p>
        <Button asChild variant="gold" size="lg">
          <Link to="/menu">{t("buy.emptyCta")}</Link>
        </Button>
      </div>
    );
  }

  const payNow = () => {
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length < 8) {
      toast.error(t("buy.missingDetails"));
      return;
    }
    saveCustomer({ name: name.trim(), phone: phone.trim(), orderType });
    navigate({ to: "/checkout" });
  };

  return (
    <div className="section-shell grid gap-8 py-12 lg:grid-cols-[1fr_24rem]">
      <div>
        <h1 className="gold-text-gradient mb-6 text-4xl">{t("buy.title")}</h1>
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.productId} className="gold-frame flex items-center gap-4 rounded-2xl p-3">
              <img
                src={item.image}
                alt=""
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg">
                  {lang === "so" ? item.nameSo : item.nameEn}
                </p>
                <p className="text-sm text-primary">{formatMaloti(item.price)}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-[var(--gold-soft)] p-1">
                <button
                  type="button"
                  aria-label={t("common.quantity")}
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                  className="grid h-7 w-7 cursor-pointer place-items-center rounded-full text-primary hover:bg-accent"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  type="button"
                  aria-label={t("common.quantity")}
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                  className="grid h-7 w-7 cursor-pointer place-items-center rounded-full text-primary hover:bg-accent"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                aria-label={t("common.remove")}
                onClick={() => remove(item.productId)}
                className="cursor-pointer p-2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <aside className="gold-frame flex h-fit flex-col gap-5 rounded-3xl p-6 lg:sticky lg:top-24">
        <div>
          <p className="mb-2 text-sm font-semibold">{t("buy.orderType")}</p>
          <div className="grid grid-cols-2 gap-2">
            {(["takeaway", "eat_in"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors ${
                  orderType === type
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-[var(--gold-soft)] text-muted-foreground hover:text-primary"
                }`}
              >
                {type === "takeaway" ? t("buy.takeaway") : t("buy.eatin")}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          {t("buy.name")}
          <Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          {t("buy.phone")}
          <Input
            value={phone}
            inputMode="tel"
            maxLength={20}
            placeholder="+266 5XXX XXXX"
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-muted-foreground">{t("common.total")}</span>
          <span className="font-display text-2xl text-primary">{formatMaloti(total)}</span>
        </div>
        <Button variant="gold" size="lg" onClick={payNow}>
          {t("buy.payNow")}
        </Button>
      </aside>
    </div>
  );
}
