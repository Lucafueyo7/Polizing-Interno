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

export type SiniestroEstado =
  | "nuevo"
  | "pendiente_documentacion"
  | "en_tramite"
  | "cerrado"
  | "rechazado";

export const SINIESTRO_STATUS: Record<
  SiniestroEstado,
  { label: string; tone: StatusTone }
> = {
  nuevo:                   { label: "Nuevo",                 tone: "info"    },
  pendiente_documentacion: { label: "Pend. documentación",   tone: "warn"    },
  en_tramite:              { label: "En trámite",            tone: "warn"    },
  cerrado:                 { label: "Cerrado",               tone: "neutral" },
  rechazado:               { label: "Rechazado",             tone: "danger"  },
};
