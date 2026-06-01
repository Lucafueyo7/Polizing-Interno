import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Filterbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 px-5 py-3.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
