"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Refresh } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { refreshDashboard } from "../_actions/refresh";

export function DashboardActions() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshDashboard();
      router.refresh();
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending}>
      <Refresh className="w-3.5 h-3.5" />
      Actualizar
    </Button>
  );
}
