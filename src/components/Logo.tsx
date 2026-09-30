import { useI18n } from "@/i18n";
import { siteConfig } from "@/config/siteConfig";

export function Logo({ compact = false }: { compact?: boolean }) {
  const { lang } = useI18n();
  const slogan = lang === "so" ? siteConfig.sloganSo : siteConfig.sloganEn;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--gold-soft)] bg-gradient-to-br from-[oklch(0.24_0.02_85)] to-black font-display text-lg font-bold text-primary">
        T&amp;M
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-lg leading-tight font-bold gold-text-gradient">
          {siteConfig.businessName}
        </span>
        {!compact && (
          <span className="block truncate text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            {slogan}
          </span>
        )}
      </span>
    </div>
  );
}
