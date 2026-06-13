"use client";

import { useTransition } from "react";
import { CheckCircle, Close } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import { rechazarPago } from "../../_actions/rechazar-pago";
import { validarPago } from "../../_actions/validar-pago";

export function PagoActions({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();

  const handleValidar = () => {
    if (!confirm("¿Confirmás la validación de este pago?")) return;
    startTransition(async () => {
      const result = await validarPago(id);
      if (result.ok) toastSuccess("Pago validado");
      else toastError(result.error);
    });
  };

  const handleRechazar = () => {
    if (!confirm("¿Confirmás el rechazo de este pago?")) return;
    startTransition(async () => {
      const result = await rechazarPago(id);
      if (result.ok) toastSuccess("Pago rechazado");
      else toastError(result.error);
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex-1" />
      <Button
        variant="destructive"
        size="sm"
        onClick={handleRechazar}
        disabled={isPending}
      >
        <Close className="w-3 h-3" />
        Rechazar
      </Button>
      <Button size="sm" onClick={handleValidar} disabled={isPending}>
        <CheckCircle className="w-3 h-3" />
        Validar pago
      </Button>
    </div>
  );
}
