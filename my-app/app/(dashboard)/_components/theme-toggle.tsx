"use client";

import { Moon, Sun } from "@/components/icons";
import { useTheme } from "@/lib/theme/theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}
      aria-label="Alternar tema"
      className="w-9 h-9 grid place-items-center border border-border rounded-lg bg-brand-surface-2 text-muted-foreground hover:bg-brand-surface-hover hover:text-foreground"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
