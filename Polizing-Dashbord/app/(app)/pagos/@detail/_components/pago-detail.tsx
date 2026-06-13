import { DocsGrid } from "@/components/shared/docs-grid";
import { KvRow } from "@/components/shared/kv-row";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fmtAR } from "@/lib/format/currency";
import { fmtDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import type { MetodoPago, PagoEstado, PagoFull } from "@/lib/data/types";

const METODO_LABEL: Record<MetodoPago, string> = {
  transferencia: "Transferencia bancaria",
  debito_automatico: "Débito automático",
  tarjeta_credito: "Tarjeta de crédito",
  tarjeta_debito: "Tarjeta de débito",
  efectivo: "Efectivo",
  mercadopago: "MercadoPago",
  cheque: "Cheque",
  otro: "Otro",
};

function metodoLabel(m: MetodoPago | null): string | null {
  return m ? METODO_LABEL[m] : null;
}
import { PagoActions } from "./pago-actions";
import { PagoBanner } from "./pago-banner";
import { PagoTotals } from "./pago-totals";

const ESTADO_LABEL: Record<PagoEstado, string> = {
  pendiente: "Pendiente de validación",
  validado: "Validado",
  rechazado: "Rechazado",
};

const ESTADO_VARIANT: Record<PagoEstado, "warn" | "success" | "danger"> = {
  pendiente: "warn",
  validado: "success",
  rechazado: "danger",
};

export function PagoDetail({ pago }: { pago: PagoFull }) {
  const isPending = pago.estado === "pendiente";

  return (
    <article className="flex flex-col h-full">
      <header className="px-6 pt-6 pb-5 border-b border-border flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant={ESTADO_VARIANT[pago.estado]}>
                {ESTADO_LABEL[pago.estado]}
              </Badge>
              <span className="font-mono text-[12px] text-muted-foreground">
                #{pago.id}
              </span>
            </div>
            <h2 className="text-[20px] font-semibold tracking-[-0.015em] leading-tight">
              {pago.cliente.label}
            </h2>
            <div className={cn("text-[13px] text-muted-foreground mt-1")}>
              {pago.fechaPago
                ? `Emitido el ${fmtDate(pago.fechaPago)}`
                : "Sin fecha de pago"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
              Total a validar
            </div>
            <div className="font-mono font-semibold text-[26px] tracking-[-0.02em] mt-0.5">
              {fmtAR(pago.monto)}
            </div>
          </div>
        </div>

        {isPending && <PagoActions id={pago.id} />}
      </header>

      <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto">
        <Card className="overflow-hidden p-0 gap-0">
          <dl className="px-5 py-2 grid grid-cols-1 gap-x-5">
            <KvRow label="Método" value={metodoLabel(pago.metodoPago)} />
          </dl>
        </Card>

        <DocsGrid docs={pago.docs} title="Comprobantes de pago" emptyLabel="Sin comprobantes adjuntos." />

        <PagoTotals pago={pago} />

        <PagoBanner estado={pago.estado} />
      </div>
    </article>
  );
}
