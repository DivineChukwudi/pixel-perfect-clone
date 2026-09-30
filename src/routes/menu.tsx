import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n/en";
import { productsQuery } from "@/lib/queries";
import { CATEGORIES } from "@/lib/products";

type MenuSearch = { q?: string | undefined; cat?: string | undefined };

export const Route = createFileRoute("/menu")({
  validateSearch: (search: Record<string, unknown>): MenuSearch => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
    cat: typeof search["cat"] === "string" && search["cat"] ? search["cat"] : undefined,
  }),
  head: () => ({ meta: [{ title: "Menu — T&M Lunch" }] }),
  component: MenuPage,
});

function MenuPage() {
  const { t } = useI18n();
  const { q, cat } = Route.useSearch();
  const navigate = useNavigate({ from: "/menu" });
  const { data, isLoading, isError } = useQuery(productsQuery);

  const needle = (q ?? "").trim().toLowerCase();
  const products = (data ?? []).filter((p) => {
    if (cat && p.category !== cat) return false;
    if (!needle) return true;
    return [p.name_en, p.name_so, p.description_en, p.description_so]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  const setSearch = (next: MenuSearch) =>
    navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });

  return (
    <div className="section-shell py-12">
      <div className="mb-8 text-center">
        <h1 className="gold-text-gradient text-4xl md:text-5xl">{t("menu.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("menu.sub")}</p>
      </div>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {[undefined, ...CATEGORIES].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              onClick={() => setSearch({ cat: c })}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors ${
                (cat ?? undefined) === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-[var(--gold-soft)] text-muted-foreground hover:text-primary"
              }`}
            >
              {c ? t(`cat.${c}` as TranslationKey) : t("menu.all")}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[var(--gold-soft)] px-4 py-2 focus-within:border-primary md:w-72">
          <Search className="h-4 w-4 shrink-0 text-primary" />
          <input
            value={q ?? ""}
            onChange={(e) => setSearch({ q: e.target.value || undefined })}
            placeholder={t("common.search")}
            aria-label={t("common.search")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-96 rounded-3xl" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-center text-muted-foreground">{t("checkout.error")}</p>
      ) : products.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("common.noResults")}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
