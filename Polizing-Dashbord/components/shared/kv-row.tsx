import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type KvRowProps = {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
};

export function KvRow({ label, value, mono = false, className }: KvRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[110px_1fr] gap-3 py-2 border-b border-border last:border-0 text-[13px]",
        className,
      )}
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-foreground min-w-0 break-words", mono && "font-mono")}>
        {value || "—"}
      </dd>
    </div>
  );
}
