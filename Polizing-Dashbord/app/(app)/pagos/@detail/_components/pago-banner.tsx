import { AlertCircle, CheckCircle, Close } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { PagoEstado } from "@/lib/data/types";

const COPY: Record<
  PagoEstado,
  {
    icon: typeof AlertCircle;
    title: string;
    text: string;
    classes: string;
  }
> = {
  pendiente: {
    icon: AlertCircle,
    title: "Verificá manualmente",
    text: "Revisá monto, comprobante y CBU contra la rendición de la empresa antes de validar.",
    classes:
      "bg-brand-warn-soft border-brand-warn/30 text-brand-warn",
  },
  validado: {
    icon: CheckCircle,
    title: "Pago validado",
    text: "Todas las pólizas asociadas fueron acreditadas en el sistema.",
    classes:
      "bg-brand-success-soft border-brand-success/30 text-brand-success",
  },
  rechazado: {
    icon: Close,
    title: "Pago rechazado",
    text: "El pago fue marcado como rechazado y no impacta sobre las pólizas.",
    classes:
      "bg-brand-danger-soft border-brand-danger/30 text-brand-danger",
  },
};

export function PagoBanner({ estado }: { estado: PagoEstado }) {
  const meta = COPY[estado];
  const Icon = meta.icon;
  return (
    <aside
      className={cn(
        "rounded-lg border px-4 py-3 flex items-start gap-3 text-[12.5px]",
        meta.classes,
      )}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        <b className="block">{meta.title}</b>
        <span>{meta.text}</span>
      </div>
    </aside>
  );
}
