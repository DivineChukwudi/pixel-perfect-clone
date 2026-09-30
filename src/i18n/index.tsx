import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en, type TranslationKey } from "./en";
import { so } from "./so";

export type Lang = "en" | "so";

const dictionaries: Record<Lang, Record<TranslationKey, string>> = { en, so };
const STORAGE_KEY = "tm-lunch-lang";

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  /** Picks the right language column from a database row. */
  pick: (row: Record<string, unknown>, base: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "so") setLangState(stored);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key) => dictionaries[lang][key] ?? en[key] ?? key,
      pick: (row, base) => String(row[`${base}_${lang}`] ?? row[`${base}_en`] ?? ""),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
