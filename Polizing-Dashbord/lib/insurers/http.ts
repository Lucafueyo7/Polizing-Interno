/**
 * Wrapper de `fetch` con timeout y reintentos con backoff exponencial.
 *
 * Reutiliza el patrón de `lib/scrapers/asegurando-digital.ts` (AbortSignal.timeout)
 * y lo generaliza para las integraciones: reintenta ante errores de red o HTTP
 * 5xx, normaliza los fallos de transporte a `InsurerError`.
 */

import { InsurerError } from "./errors";

export type HttpFetchOptions = RequestInit & {
  /** Timeout por intento, en ms. Default 30s (WSMOBImp puede tardar). */
  timeoutMs?: number;
  /** Reintentos adicionales tras el primer intento. Default 2. */
  retries?: number;
  /** Demora base para el backoff exponencial, en ms. Default 500. */
  retryDelayMs?: number;
  /** Slug del proveedor, para contexto de errores. */
  provider?: string;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function httpFetch(
  url: string,
  options: HttpFetchOptions = {},
): Promise<Response> {
  const {
    timeoutMs = 30_000,
    retries = 2,
    retryDelayMs = 500,
    provider,
    ...init
  } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      // 5xx: el servidor falló — reintentamos si quedan intentos.
      if (res.status >= 500 && attempt < retries) {
        await delay(retryDelayMs * 2 ** attempt);
        continue;
      }
      return res;
    } catch (err) {
      // Error de red / timeout — reintentamos si quedan intentos.
      lastError = err;
      if (attempt < retries) {
        await delay(retryDelayMs * 2 ** attempt);
        continue;
      }
    }
  }

  throw new InsurerError("Fallo de red al contactar la aseguradora", {
    provider,
    cause: lastError,
  });
}
