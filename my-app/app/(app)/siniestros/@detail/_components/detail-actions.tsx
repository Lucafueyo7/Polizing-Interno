"use client";

import { useTransition } from "react";
import { CheckCircle, Forward, Reply } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import type { SiniestroEstado } from "@/lib/domain/poliza-status";
import { aprobarTramite } from "../../_actions/aprobar-tramite";
import { derivarSiniestro } from "../../_actions/derivar-siniestro";

export function DetailActions({
  id,
  estado,
}: {
  id: number;
  estado: SiniestroEstado;
}) {
  const [isPending, startTransition] = useTransition();

  const handleAprobar = () => {
    startTransition(async () => {
      const result = await aprobarTramite(id);
      if (result.ok) {
        toastSuccess("Trámite aprobado");
      } else {
        toastError(result.error);
      }
    });
  };

  const handleDerivar = () => {
    startTransition(async () => {
      const result = await derivarSiniestro(id);
      if (result.ok) {
        toastSuccess("Siniestro derivado");
      } else {
        toastError(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Button variant="outline" size="sm" disabled>
        <Reply className="w-3 h-3" />
        Responder
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDerivar}
        disabled={isPending}
      >
        <Forward className="w-3 h-3" />
        Derivar
      </Button>
      {estado === "nuevo" && (
        <Button size="sm" onClick={handleAprobar} disabled={isPending}>
          <CheckCircle className="w-3 h-3" />
          Aprobar trámite
        </Button>
      )}
    </div>
  );
}
