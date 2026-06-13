"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Close } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import { rechazarPago } from "../../_actions/rechazar-pago";
import { validarPago } from "../../_actions/validar-pago";

export function PagoActions({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<
    "validar" | "rechazar" | null
  >(null);

  const handleValidar = () => setConfirmAction("validar");
  const handleRechazar = () => setConfirmAction("rechazar");

  const handleConfirm = () => {
    if (confirmAction === "validar") {
      startTransition(async () => {
        const result = await validarPago(id);
        if (result.ok) toastSuccess("Pago validado");
        else toastError(result.error);
      });
    } else if (confirmAction === "rechazar") {
      startTransition(async () => {
        const result = await rechazarPago(id);
        if (result.ok) toastSuccess("Pago rechazado");
        else toastError(result.error);
      });
    }
    setConfirmAction(null);
  };

  return (
    <>
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

      <ConfirmModal
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={
          confirmAction === "validar"
            ? "Validar pago"
            : "Rechazar pago"
        }
        description={
          confirmAction === "validar"
            ? "¿Confirmás la validación de este pago?"
            : "¿Confirmás el rechazo de este pago?"
        }
        confirmText={confirmAction === "validar" ? "Validar" : "Rechazar"}
        variant={confirmAction === "rechazar" ? "destructive" : "default"}
        onConfirm={handleConfirm}
      />
    </>
  );
}
