export type PolizaEstado =
  | "vigente"
  | "proxima"
  | "vencida"
  | "anulada"
  | "renovada";

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

export type SiniestroEstado = "nuevo" | "tramite" | "cerrado";

export const SINIESTRO_STATUS: Record<
  SiniestroEstado,
  { label: string; tone: StatusTone }
> = {
  nuevo: { label: "Nuevo", tone: "info" },
  tramite: { label: "En trámite", tone: "warn" },
  cerrado: { label: "Cerrado", tone: "neutral" },
};
