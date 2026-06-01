"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClienteAvatar } from "@/components/shared/cliente-avatar";
import { Badge } from "@/components/ui/badge";
import { fmtAR } from "@/lib/format/currency";
import { fmtDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import type { PagoListItem } from "@/lib/data/types";

const ESTADO_LABEL: Record<PagoListItem["estado"], string> = {
  pendiente: "Pendiente",
  validado: "Validado",
  rechazado: "Rechazado",
};

const ESTADO_VARIANT: Record<
  PagoListItem["estado"],
  "warn" | "success" | "danger"
> = {
  pendiente: "warn",
  validado: "success",
  rechazado: "danger",
};

export function PagoRow({ pago }: { pago: PagoListItem }) {
  const pathname = usePathname();
  const isActive = pathname === `/pagos/${pago.id}`;

  return (
    <Link
      href={`/pagos/${pago.id}`}
      data-active={isActive}
      className={cn(
        "block px-4 py-3.5 border-b border-border hover:bg-brand-surface-hover transition-colors",
        "data-[active=true]:bg-brand-primary-soft data-[active=true]:border-l-2 data-[active=true]:border-l-primary",
      )}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <ClienteAvatar letters={pago.cliente.avatarLetters} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-foreground truncate">
            {pago.cliente.label}
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {pago.cliente.ident}
          </div>
        </div>
        <Badge variant={ESTADO_VARIANT[pago.estado]} className="shrink-0">
          {ESTADO_LABEL[pago.estado]}
        </Badge>
      </div>
      <div className="flex items-end justify-between mt-1 gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[11.5px] text-muted-foreground">
            {pago.fechaPago ? fmtDate(pago.fechaPago) : "Sin fecha"}
          </div>
          <div className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
            {pago.polizasCount} pól. · {pago.metodoPago ?? "—"}
          </div>
        </div>
        <div className="font-mono font-semibold text-[15px] tracking-tight shrink-0">
          {fmtAR(pago.monto)}
        </div>
      </div>
    </Link>
  );
}
