"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@/components/icons";
import { useTheme } from "@/lib/theme/theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-once flag para evitar hydration mismatch.
    setHydrated(true);
  }, []);

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      title={hydrated ? (isDark ? "Cambiar a claro" : "Cambiar a oscuro") : "Alternar tema"}
      aria-label="Alternar tema"
      className="w-9 h-9 grid place-items-center border border-border rounded-lg bg-brand-surface-2 text-muted-foreground hover:bg-brand-surface-hover hover:text-foreground"
    >
      {hydrated ? (
        isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4 opacity-0" aria-hidden="true" />
      )}
    </button>
  );
}
