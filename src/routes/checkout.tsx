import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { useCart } from "@/lib/cart";
import { loadCustomer, saveCustomer, type CustomerDetails } from "@/lib/customer";
import { createOrder, type CreatedOrder } from "@/lib/orders";
import { paymentService, type PaymentMethod } from "@/lib/paymentService";
import { formatMaloti, isPlaceholder, siteConfig } from "@/config/siteConfig";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — T&M Lunch" }] }),
  component: CheckoutPage,
});

type Stage = "form" | "placing" | "waiting" | "success" | "failed" | "manual";

function CheckoutPage() {
  const { t, lang } = useI18n();
  const { items, total, clear } = useCart();
  const [customer, setCustomer] = useState<CustomerDetails>({ name: "", phone: "", orderType: "takeaway" });
  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [momoNumber, setMomoNumber] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [error, setError] = useState("");
  const [paidTotal, setPaidTotal] = useState(0);
  const polling = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = loadCustomer();
    setCustomer(saved);
    setMomoNumber(saved.phone);
    return () => {
      if (polling.current) clearInterval(polling.current);
    };
  }, []);

  const mode = siteConfig.payments.mode;
  const merchant =
    method === "mpesa"
      ? siteConfig.payments.mpesaMerchantNumber
      : siteConfig.payments.ecocashMerchantNumber;

  const submit = async () => {
    setError("");
    if (customer.name.trim().length < 2 || customer.phone.replace(/\D/g, "").length < 8) {
      setError(t("buy.missingDetails"));
      return;
    }
    if (momoNumber.replace(/\D/g, "").length < 8) {
      setError(t("checkout.number"));
      return;
    }
    saveCustomer(customer);
    setStage("placing");
    try {
      const created = await createOrder({
        customerName: customer.name.trim(),
        phone: customer.phone,
        orderType: customer.orderType,
        paymentMethod: mode === "manual" ? "manual" : method,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      setOrder(created);
      setPaidTotal(Number(created.total));

      if (mode === "manual") {
        clear();
        setStage("manual");
        return;
      }

      const started = await paymentService.initiatePayment({
        method,
        phone: momoNumber,
        amount: Number(created.total),
        orderNumber: created.order_number,
      });
      if (started.status === "failed") {
        setError(started.message ?? t("checkout.failed"));
        setStage("failed");
        return;
      }
      setStage("waiting");
      polling.current = setInterval(async () => {
        const result = await paymentService.checkStatus(started.reference);
        if (result.status === "pending") return;
        if (polling.current) clearInterval(polling.current);
        if (result.status === "success") {
          clear();
          setStage("success");
        } else {
          setError(result.message ?? t("checkout.failed"));
          setStage("failed");
        }
      }, 1500);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t("checkout.error"));
      setStage("form");
    }
  };

  if (stage === "placing" || stage === "waiting") {
    return (
      <Centered>
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h1 className="text-2xl">
          {stage === "placing" ? t("checkout.placing") : t("checkout.waiting")}
        </h1>
        {stage === "waiting" && (
          <p className="text-muted-foreground">{t("checkout.waitingNote")}</p>
        )}
      </Centered>
    );
  }

  if (stage === "success" || stage === "manual") {
    return (
      <Centered>
        <CheckCircle2 className="h-12 w-12 text-[var(--success)]" />
        <h1 className="text-3xl">
          {stage === "success" ? t("checkout.success") : t("checkout.manualTitle")}
        </h1>
        <div className="gold-frame rounded-2xl px-8 py-5">
          <p className="text-sm text-muted-foreground">{t("checkout.orderNumber")}</p>
          <p className="font-display text-3xl text-primary">{order?.order_number}</p>
        </div>
        {stage === "manual" ? (
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              {t("checkout.sendTo")}{" "}
              <span className="font-semibold text-foreground">
                {isPlaceholder(merchant) ? t("common.comingSoon") : merchant}
              </span>{" "}
              ({method === "mpesa" ? t("checkout.mpesa") : t("checkout.ecocash")}):{" "}
              <span className="font-semibold text-primary">{formatMaloti(paidTotal)}</span>
            </p>
            <p>
              {t("checkout.useReference")}:{" "}
              <span className="font-semibold text-foreground">{order?.order_number}</span>
            </p>
            <p>{t("checkout.manualNote")}</p>
          </div>
        ) : (
          <p className="text-muted-foreground">
            {t("checkout.successNote")}
            {mode === "simulated" ? ` ${t("checkout.simulatedNote")}` : ""}
          </p>
        )}
        <Button asChild variant="gold" size="lg">
          <Link to="/menu">{t("checkout.done")}</Link>
        </Button>
      </Centered>
    );
  }

  if (stage === "failed") {
    return (
      <Centered>
        <XCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl">{t("checkout.failed")}</h1>
        {error && <p className="text-muted-foreground">{error}</p>}
        <Button variant="gold" size="lg" onClick={() => setStage("form")}>
          {t("checkout.retry")}
        </Button>
      </Centered>
    );
  }

  if (items.length === 0) {
    return (
      <Centered>
        <p className="text-muted-foreground">{t("checkout.emptyList")}</p>
        <Button asChild variant="gold" size="lg">
          <Link to="/menu">{t("buy.emptyCta")}</Link>
        </Button>
      </Centered>
    );
  }

  return (
    <div className="section-shell grid gap-8 py-12 lg:grid-cols-[1fr_24rem]">
      <div className="flex flex-col gap-6">
        <h1 className="gold-text-gradient text-4xl">{t("checkout.title")}</h1>

        <section className="gold-frame flex flex-col gap-4 rounded-3xl p-6">
          <h2 className="text-xl">{t("checkout.details")}</h2>
          <label className="flex flex-col gap-1.5 text-sm">
            {t("buy.name")}
            <Input
              value={customer.name}
              maxLength={80}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            {t("buy.phone")}
            <Input
              value={customer.phone}
              inputMode="tel"
              maxLength={20}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["takeaway", "eat_in"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCustomer({ ...customer, orderType: type })}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors ${
                  customer.orderType === type
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-[var(--gold-soft)] text-muted-foreground hover:text-primary"
                }`}
              >
                {type === "takeaway" ? t("buy.takeaway") : t("buy.eatin")}
              </button>
            ))}
          </div>
        </section>

        <section className="gold-frame flex flex-col gap-4 rounded-3xl p-6">
          <h2 className="text-xl">{t("checkout.choose")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {(["mpesa", "ecocash"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`cursor-pointer rounded-2xl border px-4 py-4 font-display text-lg transition-colors ${
                  method === m
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-[var(--gold-soft)] text-muted-foreground hover:text-primary"
                }`}
              >
                {m === "mpesa" ? t("checkout.mpesa") : t("checkout.ecocash")}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            {t("checkout.number")}
            <Input
              value={momoNumber}
              inputMode="tel"
              maxLength={20}
              onChange={(e) => setMomoNumber(e.target.value)}
            />
          </label>
        </section>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <aside className="gold-frame flex h-fit flex-col gap-4 rounded-3xl p-6 lg:sticky lg:top-24">
        <h2 className="text-xl">{t("checkout.summary")}</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-3">
              <span>
                {i.quantity} × {lang === "so" ? i.nameSo : i.nameEn}
              </span>
              <span className="text-muted-foreground">{formatMaloti(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-muted-foreground">{t("common.total")}</span>
          <span className="font-display text-2xl text-primary">{formatMaloti(total)}</span>
        </div>
        <Button variant="gold" size="lg" onClick={submit}>
          {t("checkout.confirm")}
        </Button>
      </aside>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-shell flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center">
      {children}
    </div>
  );
}
