export type PolizaEstado =
  | "vigente"
  | "proxima"
  | "vencida"
  | "anulada"
  | "renovada";

/**
 * Deriva el estado real de una póliza en tiempo de lectura.
 * - "anulada" y "renovada" son estados manuales persistidos: se respetan siempre.
 * - Si hay fecha de fin de vigencia: calcula vigente/proxima/vencida contra `now`.
 *   Proxima = entre hoy y 60 días; Vencida = fecha ya pasó.
 * - Sin fecha: devuelve el estado guardado.
 */
export function derivePolizaEstado(
  stored: PolizaEstado,
  finVigencia: Date | null | undefined,
  now: Date = new Date(),
): PolizaEstado {
  if (stored === "anulada" || stored === "renovada") return stored;
  if (!finVigencia) return stored;
  const finMs = finVigencia.getTime();
  const nowMs = now.getTime();
  if (finMs < nowMs) return "vencida";
  const diasRestantes = Math.round((finMs - nowMs) / 86_400_000);
  if (diasRestantes <= 60) return "proxima";
  return "vigente";
}

export type StatusTone = "success" | "warn" | "danger" | "neutral" | "info";

export const POLIZA_STATUS: Record<
  PolizaEstado,
  { label: string; tone: StatusTone }
> = {
  vigente: { label: "Vigente", tone: "success" },
  proxima: { label: "Próx. a vencer", tone: "warn" },
  vencida: { label: "Vencida", tone: "danger" },
  anulada: { label: "Anulada", tone: "neutral" },
  renovada: { label: "Renovada", tone: "info" },
};

export type SiniestroEstado =
  | "nuevo"
  | "en_tramite"
  | "cerrado";

export const SINIESTRO_STATUS: Record<
  SiniestroEstado,
  { label: string; tone: StatusTone }
> = {
  nuevo:      { label: "Nuevo",      tone: "info"    },
  en_tramite: { label: "En trámite", tone: "warn"    },
  cerrado:    { label: "Cerrado",    tone: "neutral" },
};
