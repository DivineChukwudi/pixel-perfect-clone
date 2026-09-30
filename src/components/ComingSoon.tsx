import { Clock } from "lucide-react";
import { useI18n } from "@/i18n";

export function ComingSoon({ label, className = "" }: { label?: string; className?: string }) {
  const { t } = useI18n();
  return (
    <div
      className={`gold-frame flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-12 text-center ${className}`}
    >
      <Clock className="h-6 w-6 text-primary" />
      <p className="font-display text-lg text-foreground">{label ?? t("common.comingSoon")}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{t("common.comingSoonNote")}</p>
    </div>
  );
}
