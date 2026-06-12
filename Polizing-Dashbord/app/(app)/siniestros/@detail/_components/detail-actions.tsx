"use client";

import { useTransition } from "react";
import { CheckCircle, XCircle, ArrowLeft } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import type { SiniestroEstado } from "@/lib/domain/poliza-status";
import { aprobarTramite } from "../../_actions/aprobar-tramite";
import { cerrarSiniestro } from "../../_actions/cerrar-siniestro";
import { retrocederSiniestro } from "../../_actions/retroceder-siniestro";

export function DetailActions({
  id,
  estado,
}: {
  id: number;
  estado: SiniestroEstado;
}) {
  const [isPending, startTransition] = useTransition();

  const handleAction = (action: () => Promise<{ ok: boolean; error?: string }>, successMsg: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toastSuccess(successMsg);
      } else {
        toastError(result.error ?? "Error");
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {estado === "nuevo" && (
        <Button size="sm" onClick={() => handleAction(() => aprobarTramite(id), "Trámite aprobado")} disabled={isPending}>
          <CheckCircle className="w-3 h-3" />
          Aprobar trámite
        </Button>
      )}
      {estado === "en_tramite" && (
        <>
          <Button variant="outline" size="sm" onClick={() => handleAction(() => retrocederSiniestro(id, "en_tramite"), "Siniestro devuelto a nuevo")} disabled={isPending}>
            <ArrowLeft className="w-3 h-3" />
            Volver a nuevo
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleAction(() => cerrarSiniestro(id), "Siniestro cerrado")} disabled={isPending}>
            <XCircle className="w-3 h-3" />
            Cerrar siniestro
          </Button>
        </>
      )}
      {estado === "cerrado" && (
        <Button variant="outline" size="sm" onClick={() => handleAction(() => retrocederSiniestro(id, "cerrado"), "Siniestro devuelto a en trámite")} disabled={isPending}>
          <ArrowLeft className="w-3 h-3" />
          Volver a en trámite
        </Button>
      )}
    </div>
  );
}
