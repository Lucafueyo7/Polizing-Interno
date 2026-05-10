"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

type Tab = {
  value: string;
  label: string;
  count?: number;
};

type ClienteTabsHeaderProps = {
  clienteId: number;
  active: string;
  tabs: ReadonlyArray<Tab>;
};

export function ClienteTabsHeader({
  clienteId,
  active,
  tabs,
}: ClienteTabsHeaderProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <div
      role="tablist"
      className="flex items-center gap-1 px-3 pt-3 border-b border-border"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              startTransition(() => {
                router.push(`/clientes/${clienteId}?tab=${tab.value}`);
              });
            }}
            className={cn(
              "relative px-3 py-2 text-[13px] font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "font-mono text-[11px] px-1.5 rounded-full",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute inset-x-3 -bottom-px h-0.5 bg-foreground rounded-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
