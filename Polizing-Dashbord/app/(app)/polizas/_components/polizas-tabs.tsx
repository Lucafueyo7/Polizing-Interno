"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import type { PolizaCounts, PolizaTab } from "@/lib/data/types";

type TabDef = { value: PolizaTab; label: string };

const TABS: ReadonlyArray<TabDef> = [
  { value: "all", label: "Todas" },
  { value: "vigente", label: "Vigentes" },
  { value: "porVencer", label: "Próx. a vencer" },
  { value: "renovada", label: "Renovadas" },
  { value: "vencida", label: "Vencidas" },
  { value: "anulada", label: "Anuladas" },
];

type PolizasTabsProps = {
  active: PolizaTab;
  counts: PolizaCounts;
};

export function PolizasTabs({ active, counts }: PolizasTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const goToTab = (tab: PolizaTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "all") params.delete("tab");
    else params.set("tab", tab);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/polizas?${qs}` : "/polizas");
    });
  };

  return (
    <div
      role="tablist"
      className="flex items-center gap-1 px-3 pt-3 border-b border-border overflow-x-auto"
    >
      {TABS.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => goToTab(tab.value)}
            className={cn(
              "relative px-3 py-2 text-[13px] font-medium transition-colors whitespace-nowrap",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              <span
                className={cn(
                  "font-mono text-[11px] px-1.5 rounded-full",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {counts[tab.value]}
              </span>
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
