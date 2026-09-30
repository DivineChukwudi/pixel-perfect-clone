import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChefHat, Gift, HeartHandshake, ShieldCheck, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { ComingSoon } from "@/components/ComingSoon";
import { useI18n } from "@/i18n";
import { productsQuery, promotionsQuery, siteSettingsQuery, getSettingValue } from "@/lib/queries";
import { productImage } from "@/lib/products";
import { toVideoSource } from "@/lib/video";
import { formatMaloti, isPlaceholder, siteConfig } from "@/config/siteConfig";
import heroKota from "@/assets/hero-kota.jpg";

export const Route = createFileRoute("/")({
  component: Home,
});

const values = [
  { icon: ChefHat, title: "home.value1", text: "home.value1Text" },
  { icon: Smile, title: "home.value2", text: "home.value2Text" },
  { icon: ShieldCheck, title: "home.value3", text: "home.value3Text" },
  { icon: HeartHandshake, title: "home.value4", text: "home.value4Text" },
] as const;

function Home() {
  const { t, lang, pick } = useI18n();
  const products = useQuery(productsQuery);
  const promotions = useQuery(promotionsQuery);
  const settings = useQuery(siteSettingsQuery);

  const all = products.data ?? [];
  const featured = all.filter((p) => p.featured && p.available);
  const special =
    all.find((p) => p.is_special && p.available) ??
    all.find((p) => p.category === "kota" && p.available) ??
    featured[0];
  const activePromo = (promotions.data ?? []).find((p) => p.active);
  const videoUrl = getSettingValue(settings.data, "video_url", siteConfig.videoUrl);
  const hasVideoNow = !isPlaceholder(videoUrl);

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroKota}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-90 dark:opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cream/80 via-background/60 to-background/90 dark:from-background dark:via-background/70 dark:to-background/35" />
        <div className="section-shell flex min-h-[70vh] flex-col justify-center gap-6 py-20">
          <p className="fade-up text-xs font-semibold tracking-[0.3em] text-primary uppercase">
            {t("home.heroEyebrow")}
          </p>
          <h1 className="fade-up gold-text-gradient max-w-3xl text-5xl leading-tight md:text-7xl">
            {lang === "so" ? siteConfig.sloganSo : siteConfig.sloganEn}
          </h1>
          <div className="fade-up flex flex-wrap gap-3">
            <Button asChild variant="gold" size="xl">
              <Link to="/menu">{t("common.orderNow")}</Link>
            </Button>
            <Button asChild variant="goldOutline" size="xl">
              <Link to="/promotions">{t("nav.promotions")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured carousel */}
      <section className="section-shell py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl md:text-4xl">{t("home.featured")}</h2>
            <p className="mt-2 text-muted-foreground">{t("home.featuredSub")}</p>
          </div>
          <Button asChild variant="goldOutline" className="rounded-full">
            <Link to="/menu">{t("home.viewAll")}</Link>
          </Button>
        </div>
        {products.isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-96 rounded-3xl" />
            ))}
          </div>
        ) : (
          <Carousel opts={{ align: "start", loop: featured.length > 3 }} className="px-1">
            <CarouselContent>
              {featured.map((product) => (
                <CarouselItem key={product.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        )}
      </section>

      {/* Today's special */}
      {special && (
        <section className="section-shell pb-16">
          <div className="gold-frame grid overflow-hidden rounded-3xl md:grid-cols-2">
            <img
              src={productImage(special)}
              alt={pick(special as unknown as Record<string, unknown>, "name")}
              loading="lazy"
              className="h-72 w-full object-cover md:h-full"
            />
            <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
              <p className="text-xs font-semibold tracking-[0.3em] text-primary uppercase">
                {t("home.todaysSpecial")}
              </p>
              <h2 className="text-3xl md:text-4xl">
                {pick(special as unknown as Record<string, unknown>, "name")}
              </h2>
              <p className="text-muted-foreground">
                {pick(special as unknown as Record<string, unknown>, "description")}
              </p>
              <p className="font-display text-3xl text-primary">
                {formatMaloti(Number(special.price))}
              </p>
              <Button asChild variant="gold" size="lg" className="w-fit">
                <Link to="/menu">{t("common.orderNow")}</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Video */}
      <section className="section-shell pb-16">
        <div className="mb-6 text-center">
          <h2 className="text-3xl md:text-4xl">{t("home.video")}</h2>
          <p className="mt-2 text-muted-foreground">{t("home.videoSub")}</p>
        </div>
        {hasVideoNow ? (
          (() => {
            const source = toVideoSource(videoUrl);
            return source.kind === "iframe" ? (
              <iframe
                src={source.src}
                title={t("home.video")}
                allowFullScreen
                className="gold-frame aspect-video w-full rounded-3xl"
              />
            ) : (
              <video
                src={source.src}
                controls
                muted
                playsInline
                className="gold-frame aspect-video w-full rounded-3xl bg-black"
              />
            );
          })()
        ) : (
          <ComingSoon label={t("home.video")} className="aspect-video" />
        )}
      </section>

      {/* Why */}
      <section className="section-shell pb-16">
        <h2 className="mb-8 text-center text-3xl md:text-4xl">{t("home.why")}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, text }) => (
            <div key={title} className="gold-frame flex flex-col items-center gap-3 rounded-3xl p-6 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-[var(--gold-soft)] text-primary">
                <Icon className="h-7 w-7" />
              </span>
              <h3 className="text-lg">{t(title)}</h3>
              <p className="text-sm text-muted-foreground">{t(text)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Promo banner + loyalty */}
      <section className="section-shell grid gap-5 pb-20 md:grid-cols-2">
        <div className="gold-frame flex flex-col justify-center gap-3 rounded-3xl p-8">
          <p className="text-xs font-semibold tracking-[0.3em] text-primary uppercase">
            {t("home.promoBanner")}
          </p>
          <h3 className="text-2xl">
            {activePromo
              ? pick(activePromo as unknown as Record<string, unknown>, "title")
              : t("nav.promotions")}
          </h3>
          {activePromo && (
            <p className="text-sm text-muted-foreground">
              {pick(activePromo as unknown as Record<string, unknown>, "description")}
            </p>
          )}
        </div>
        {siteConfig.loyalty.enabled && (
          <div className="gold-frame flex flex-col justify-center gap-3 rounded-3xl p-8">
            <Gift className="h-8 w-8 text-primary" />
            <h3 className="text-2xl">{t("home.loyaltyTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("home.loyaltyText")}</p>
            <Button asChild variant="goldOutline" className="w-fit rounded-full">
              <Link to="/promotions">{t("home.loyaltyCta")}</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
