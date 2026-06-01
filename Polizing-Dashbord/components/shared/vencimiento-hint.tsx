import { cn } from "@/lib/utils";
import type { PolizaEstado } from "@/lib/domain/poliza-status";

type VencimientoHintProps = {
  dias: number | null;
  estado: PolizaEstado;
};

export function VencimientoHint({ dias, estado }: VencimientoHintProps) {
  if (dias === null) return null;
  if (estado !== "vigente" && estado !== "proxima") return null;
  if (dias < 0 || dias > 60) return null;

  const tone = dias <= 15 ? "text-brand-danger" : "text-brand-warn";
  const label =
    dias === 0 ? "Vence hoy" : dias === 1 ? "Vence mañana" : `Vence en ${dias} días`;

  return (
    <span className={cn("text-[11px] font-semibold", tone)}>{label}</span>
  );
}
