export type PolizaEstado = "vigente" | "vencida";

/**
 * Deriva el estado real de una póliza en tiempo de lectura.
 * - Si hay fecha de fin de vigencia y ya pasó → "vencida"; si no → "vigente".
 * - Sin fecha: devuelve el estado guardado.
 */
export function derivePolizaEstado(
  stored: PolizaEstado,
  finVigencia: Date | null | undefined,
  now: Date = new Date(),
): PolizaEstado {
  if (!finVigencia) return stored;
  // Vencida solo si la fecha de fin es anterior a hoy (el día de vencimiento
  // se considera vigente; el día siguiente pasa a vencida).
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return finVigencia.getTime() < startOfToday ? "vencida" : "vigente";
}

export type StatusTone = "success" | "warn" | "danger" | "neutral" | "info";

export const POLIZA_STATUS: Record<
  PolizaEstado,
  { label: string; tone: StatusTone }
> = {
  vigente: { label: "Vigente", tone: "success" },
  vencida: { label: "Vencida", tone: "danger" },
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
