export const CACHE_TAGS = {
  clientes: "clientes",
  polizas: "polizas",
  siniestros: "siniestros",
  aseguradoras: "aseguradoras",
  pagos: "pagos",
  dashboard: "dashboard",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];
