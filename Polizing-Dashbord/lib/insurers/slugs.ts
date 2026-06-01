/** Slugs de integración soportados. Coinciden con `empresas_aseguradoras.codigo_integracion`. */
export const INSURER_SLUGS = ["berkley", "federacion_patronal"] as const;

export type InsurerSlug = (typeof INSURER_SLUGS)[number];

export function isInsurerSlug(value: string): value is InsurerSlug {
  return (INSURER_SLUGS as readonly string[]).includes(value);
}
