import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--gold-soft)] text-primary transition-shadow hover:shadow-[0_0_20px_-6px_var(--gold-glow)]"
    >
      {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </button>
  );
}
