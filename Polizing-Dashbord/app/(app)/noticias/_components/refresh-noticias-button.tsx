"use client";

import { useTransition } from "react";
import { Refresh } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { refreshNoticias } from "../_actions/refresh";

export function RefreshNoticiasButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(() => refreshNoticias())}
    >
      <Refresh
        className={isPending ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"}
        aria-hidden="true"
      />
      {isPending ? "Actualizando…" : "Actualizar"}
    </Button>
  );
}
