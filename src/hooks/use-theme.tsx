import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

const STORAGE_KEY = "tm-lunch-theme";

type ThemeValue = {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

const applyTheme = (resolved: ResolvedTheme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }
  root.style.colorScheme = resolved;
};

const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return theme;
};

const readStored = (): Theme => {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light" || stored === "system") return stored;
  return "dark";
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    const stored = readStored();
    setThemeState(stored);
    setResolved(resolveTheme(stored));
    applyTheme(resolveTheme(stored));

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onSystemChange = () => {
      const current = readStored();
      if (current === "system") {
        const r = resolveTheme("system");
        setResolved(r);
        applyTheme(r);
      }
    };
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    const r = resolveTheme(next);
    setResolved(r);
    applyTheme(r);
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  const value = useMemo<ThemeValue>(
    () => ({ theme, resolved, setTheme, toggle }),
    [theme, resolved, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
