import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { promotionsQuery } from "@/lib/queries";
import { siteConfig } from "@/config/siteConfig";

export const Route = createFileRoute("/promotions")({
  head: () => ({ meta: [{ title: "Promotions — T&M Lunch" }] }),
  component: PromotionsPage,
});

function PromotionsPage() {
  const { t, pick } = useI18n();
  const { data, isLoading } = useQuery(promotionsQuery);
  const now = Date.now();
  const active = (data ?? []).filter((p) => {
    const row = p as unknown as { starts_at?: string | null; ends_at?: string | null };
    if (!p.active) return false;
    if (row.starts_at && new Date(row.starts_at).getTime() > now) return false;
    if (row.ends_at && new Date(row.ends_at).getTime() < now) return false;
    return true;
  });

  return (
    <div className="section-shell py-12">
      <div className="mb-8 text-center">
        <h1 className="gold-text-gradient text-4xl md:text-5xl">{t("promo.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("promo.sub")}</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : active.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("promo.none")}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {active.map((promo) => (
            <article key={promo.id} className="gold-frame flex flex-col gap-3 rounded-3xl p-7">
              <Gift className="h-7 w-7 text-primary" />
              <h2 className="text-2xl">{pick(promo as unknown as Record<string, unknown>, "title")}</h2>
              <p className="text-muted-foreground">
                {pick(promo as unknown as Record<string, unknown>, "description")}
              </p>
            </article>
          ))}
        </div>
      )}

      {siteConfig.loyalty.enabled && (
        <section className="gold-frame mt-10 rounded-3xl p-8 text-center">
          <h2 className="text-2xl md:text-3xl">{t("promo.loyaltyTitle")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t("promo.loyaltyText")}</p>
        </section>
      )}
    </div>
  );
}
