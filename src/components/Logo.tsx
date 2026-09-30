import { siteConfig } from "@/config/siteConfig";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src="/logo/primaryLogo.png"
      alt={siteConfig.businessName}
      className={`shrink-0 object-contain drop-shadow-[0_0_24px_rgba(183,135,0,0.35)] ${
        compact ? "h-11 w-36" : "h-16 w-52 sm:h-20 sm:w-64"
      }`}
      loading="eager"
    />
  );
}
