import { MessageCircle } from "lucide-react";
import { hasWhatsapp, whatsappLink } from "@/config/siteConfig";
import { useI18n } from "@/i18n";

export function WhatsAppButton() {
  const { t } = useI18n();
  const enabled = hasWhatsapp();

  const className =
    "fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full border border-[var(--gold-soft)] bg-gradient-to-r from-primary to-[oklch(0.68_0.12_78)] px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_14px_36px_-12px_var(--gold-glow)] transition-transform hover:scale-[1.03]";

  if (!enabled) {
    return (
      <span
        className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full border border-[var(--gold-soft)] bg-card px-4 py-3 text-sm font-semibold text-muted-foreground"
        title={t("wa.unavailable")}
      >
        <MessageCircle className="h-5 w-5 text-primary" />
        <span className="hidden sm:inline">{t("wa.unavailable")}</span>
      </span>
    );
  }

  return (
    <a
      href={whatsappLink(t("wa.message"))}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">{t("wa.button")}</span>
    </a>
  );
}
