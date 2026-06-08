import { revalidateTag, unstable_cache } from "next/cache";

/** Default cache TTL in seconds for all data-layer getters. */
export const DEFAULT_CACHE_TTL_SECONDS = 120;

/** Domain cache tags used to group invalidation by data area. */
export const CACHE_TAGS = {
  polizas: "polizas",
  clientes: "clientes",
  siniestros: "siniestros",
  pagos: "pagos",
  kpis: "kpis",
  actividad: "actividad",
} as const;

/** Domain-specific TTL defaults in seconds. */
export const DOMAIN_CACHE_TTL_SECONDS: Partial<Record<CacheTag, number>> = {
  kpis: 300,
  actividad: 300,
};

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/**
 * Wrap an async getter with Next.js cache semantics.
 *
 * @template TArgs - Argument tuple accepted by the getter.
 * @template TResult - Resolved result returned by the getter.
 * @param getter - Async function to cache.
 * @param keyParts - Stable cache key parts, including any filter params.
 * @param tag - Domain cache tag used for invalidation.
 * @param ttlSeconds - Optional TTL override in seconds.
 * @returns A cached version of the getter.
 *
 * @example
 * const getCachedPolizas = createCachedGetter(
 *   getAllPolizas,
 *   ["polizas", "all"],
 *   CACHE_TAGS.polizas,
 * );
 */
export function createCachedGetter<TArgs extends unknown[], TResult>(
  getter: (...args: TArgs) => Promise<TResult>,
  keyParts: readonly (string | number | boolean)[],
  tag: CacheTag,
  ttlSeconds?: number,
): (...args: TArgs) => Promise<TResult> {
  const revalidate = ttlSeconds ?? DOMAIN_CACHE_TTL_SECONDS[tag] ?? DEFAULT_CACHE_TTL_SECONDS;
  return unstable_cache(getter, keyParts.map(String), {
    tags: [tag],
    revalidate,
  });
}

export { revalidateTag };
