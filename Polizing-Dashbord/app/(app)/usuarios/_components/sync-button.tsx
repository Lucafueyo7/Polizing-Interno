"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Refresh } from "@/components/icons";
import { syncUsuarios } from "../_actions/sync-usuarios";
import { toastSuccess, toastError } from "@/lib/ui/toast";
import { cn } from "@/lib/utils";

type SyncState = { ok: boolean; error?: string; data?: { created: number; updated: number } } | null;

export function SyncButton() {
  const [state, action, pending] = useActionState<SyncState>(syncUsuarios, null);

  useEffect(() => {
    if (state === null) return;
    if (state.ok) {
      const d = state.data;
      toastSuccess(`Sincronizados: ${d?.created ?? 0} creados, ${d?.updated ?? 0} actualizados`);
    } else {
      toastError(state.error ?? "Error al sincronizar");
    }
  }, [state]);

  return (
    <form action={action}>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <Refresh className={cn("w-3.5 h-3.5", pending && "animate-spin")} />
        {pending ? "Sincronizando\u2026" : "Sincronizar usuarios"}
      </Button>
    </form>
  );
}
