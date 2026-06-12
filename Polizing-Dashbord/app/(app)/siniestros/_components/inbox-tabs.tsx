"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { SiniestroCounts, SiniestroTab } from "@/lib/data/types";

const TABS: ReadonlyArray<{ value: SiniestroTab; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "nuevo", label: "Nuevos" },
  { value: "en_tramite", label: "En trámite" },
  { value: "cerrado", label: "Cerrados" },
];

export function InboxTabs({ counts }: { counts: SiniestroCounts }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const urlTab = (searchParams.get("tab") as SiniestroTab) ?? "all";
  const [localTab, setLocalTab] = useState<SiniestroTab>(urlTab);

  useEffect(() => {
    setLocalTab(urlTab);
  }, [urlTab]);

  const active = localTab;

  const goToTab = (tab: SiniestroTab) => {
    setLocalTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "all") params.delete("tab");
    else params.set("tab", tab);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/siniestros?${qs}` : "/siniestros");
    });
  };

  return (
    <div role="tablist" className="flex items-center gap-1 border-b border-border">
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
              "relative px-3.5 py-2.5 text-[13px] font-medium transition-colors",
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
                className="absolute inset-x-3.5 -bottom-px h-0.5 bg-foreground rounded-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
