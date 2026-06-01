/**
 * OAuth2 (password grant) de Federación Patronal. SOLO server-side: la API audita
 * que las credenciales no queden expuestas en el navegador.
 *
 * Flujo (ver doc FedPat §Autenticación): POST /oauth/token con Basic Auth
 * base64(client_id:client_secret) y body grant_type=password&username&password.
 * El token se cachea en memoria hasta poco antes de expirar.
 */

import "server-only";
import type { FedPatConfig } from "../../config";
import { httpFetch } from "../../http";
import { InsurerAuthError } from "../../errors";

type CachedToken = { token: string; expiresAt: number };

/** Cache a nivel módulo (una cuenta por aseguradora). */
let tokenCache: CachedToken | null = null;

/** Margen de seguridad antes de la expiración real, en ms. */
const EXPIRY_SAFETY_MS = 30_000;

export function clearTokenCache(): void {
  tokenCache = null;
}

export async function getAccessToken(
  config: FedPatConfig,
  force = false,
): Promise<string> {
  const now = Date.now();
  if (!force && tokenCache && tokenCache.expiresAt > now + EXPIRY_SAFETY_MS) {
    return tokenCache.token;
  }

  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString(
    "base64",
  );
  const body = new URLSearchParams({
    grant_type: "password",
    username: config.username,
    password: config.password,
  });

  const res = await httpFetch(`${config.baseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    provider: "federacion_patronal",
  });

  if (!res.ok) {
    const detail = await safeErrorDescription(res);
    throw new InsurerAuthError("No se pudo obtener el token de Federación Patronal", {
      provider: "federacion_patronal",
      status: res.status,
      detail,
    });
  }

  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!json.access_token) {
    throw new InsurerAuthError("Respuesta de token sin access_token", {
      provider: "federacion_patronal",
    });
  }

  const expiresInMs = (json.expires_in ?? 3600) * 1000;
  tokenCache = { token: json.access_token, expiresAt: now + expiresInMs };
  return tokenCache.token;
}

async function safeErrorDescription(res: Response): Promise<string | undefined> {
  try {
    const json = (await res.json()) as { error_description?: string; error?: string };
    return json.error_description ?? json.error;
  } catch {
    return undefined;
  }
}
