import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme();
  const isDark = resolved === "dark";

  return (
    <div
      className="relative flex h-9 shrink-0 items-center rounded-full border border-border bg-muted/80 p-0.5 shadow-inner"
      role="group"
      aria-label="Colour theme"
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-0.5 h-8 w-8 rounded-full bg-primary shadow-[0_6px_16px_-8px_var(--gold-glow)] transition-transform duration-300 ease-out",
          isDark ? "translate-x-8" : "translate-x-0",
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setTheme("light")}
        aria-label="Use light mode"
        aria-pressed={!isDark}
        title="Light mode"
        className={cn(
          "relative z-10 h-8 w-8 rounded-full p-0 hover:bg-transparent",
          !isDark ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Sun className="h-4 w-4 transition-transform duration-300" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setTheme("dark")}
        aria-label="Use dark mode"
        aria-pressed={isDark}
        title="Dark mode"
        className={cn(
          "relative z-10 h-8 w-8 rounded-full p-0 hover:bg-transparent",
          isDark ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Moon className="h-4 w-4 transition-transform duration-300" />
      </Button>
    </div>
  );
}
