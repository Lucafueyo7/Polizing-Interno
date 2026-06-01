import type { ReactNode } from "react";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-muted-foreground border-b border-border pb-1.5">
      {children}
    </div>
  );
}
