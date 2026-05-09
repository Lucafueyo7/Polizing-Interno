"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "@/components/icons";
import { NAV_ITEMS } from "./sidebar-nav";

export function Breadcrumb() {
  const pathname = usePathname();
  const item = NAV_ITEMS.find((nav) => pathname.startsWith(nav.matchPrefix));

  return (
    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <span>Polizing</span>
      <ChevronRight className="w-3 h-3" />
      <b className="text-foreground font-semibold text-[14px]">
        {item?.label ?? ""}
      </b>
    </div>
  );
}
