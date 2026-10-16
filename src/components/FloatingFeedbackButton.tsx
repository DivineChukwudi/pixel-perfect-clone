import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n";

const SHOW_AFTER = 280;

export function FloatingFeedbackButton() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Link
      to="/feedback"
      aria-hidden={!visible}
      tabIndex={visible ? undefined : -1}
      className={`fixed left-0 top-1/2 z-50 flex -translate-y-1/2 items-center rounded-r-lg border-y border-r border-[var(--gold-soft)] bg-background/80 px-1.5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary shadow-[3px_0_18px_-8px_var(--gold-glow)] backdrop-blur-md transition-all duration-500 ease-out hover:text-primary ${
        visible ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-full opacity-0"
      }`}
    >
      <span className="[writing-mode:vertical-lr] rotate-180">{t("nav.feedback")}</span>
    </Link>
  );
}
