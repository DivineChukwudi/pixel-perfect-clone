import { useI18n } from "@/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex shrink-0 items-center rounded-full border border-[var(--gold-soft)] p-0.5 text-xs font-semibold">
      {(["en", "so"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`cursor-pointer rounded-full px-2.5 py-1 transition-colors ${
            lang === code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
