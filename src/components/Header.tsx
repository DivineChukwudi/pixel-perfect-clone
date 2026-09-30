import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { useI18n } from "@/i18n";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", key: "nav.home" },
  { to: "/menu", key: "nav.menu" },
  { to: "/promotions", key: "nav.promotions" },
  { to: "/about", key: "nav.about" },
] as const;

export function Header() {
  const { t } = useI18n();
  const { count } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate({ to: "/menu", search: { q: query || undefined } });
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-lg">
      <div className="section-shell grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
        <Link to="/" className="min-w-0">
          <Logo />
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-primary" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="rounded-full px-3 py-2 text-sm font-medium transition-colors hover:text-primary"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="hidden items-center md:flex">
            <div className="flex items-center gap-2 rounded-full border border-[var(--gold-soft)] px-3 py-1.5 focus-within:border-primary">
              <Search className="h-4 w-4 shrink-0 text-primary" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("common.search")}
                aria-label={t("common.search")}
                className="w-32 bg-transparent text-sm outline-none placeholder:text-muted-foreground xl:w-44"
              />
            </div>
          </form>

          <LanguageToggle />
          <ThemeToggle />

          <Link
            to="/buy-list"
            aria-label={t("nav.buyList")}
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--gold-soft)] text-primary transition-shadow hover:shadow-[0_0_20px_-6px_var(--gold-glow)]"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          <Button
            variant="goldOutline"
            size="icon"
            className="rounded-full lg:hidden"
            aria-label={t("nav.menu")}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background/95 lg:hidden">
          <div className="section-shell flex flex-col gap-1 py-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-foreground hover:text-primary"
              >
                {t(item.key)}
              </Link>
            ))}
            <Link
              to="/feedback"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 text-sm font-medium text-foreground hover:text-primary"
            >
              {t("nav.feedback")}
            </Link>
            <form onSubmit={submitSearch} className="mt-1 flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-full border border-[var(--gold-soft)] px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-primary" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("common.search")}
                  aria-label={t("common.search")}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
