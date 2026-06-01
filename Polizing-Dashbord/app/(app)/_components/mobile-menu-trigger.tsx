"use client";

import { Menu } from "@/components/icons";
import { toggleMobile } from "./sidebar-state";

export function MobileMenuTrigger() {
  return (
    <button
      type="button"
      onClick={toggleMobile}
      aria-label="Abrir menú"
      className="md:hidden w-9 h-9 grid place-items-center border border-border rounded-lg bg-brand-surface-2 text-muted-foreground hover:bg-brand-surface-hover hover:text-foreground shrink-0"
    >
      <Menu className="w-4 h-4" />
    </button>
  );
}
