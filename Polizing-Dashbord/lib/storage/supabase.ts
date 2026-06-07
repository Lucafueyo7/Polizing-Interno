/**
 * Cliente de Supabase Storage (solo server-side).
 *
 * Usa la `service_role` key, que bypassea las RLS policies del bucket: por eso
 * NUNCA debe importarse desde código cliente. El bucket `siniestros_documentos`
 * es privado; las fotos/PDFs de siniestros se sirven mediante signed URLs.
 */

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SINIESTROS_BUCKET = "siniestros_documentos";

/** Validez por defecto de las signed URLs (1 hora). */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Configuración incompleta de Supabase Storage. Revisá SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/**
 * Sube un documento de siniestro al bucket y devuelve el path almacenado
 * (lo que guardamos en `siniestro_documentos.url`).
 */
export async function uploadSiniestroDoc(
  path: string,
  bytes: Uint8Array,
  mime: string,
): Promise<string> {
  const { error } = await getClient()
    .storage.from(SINIESTROS_BUCKET)
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (error) {
    throw new Error(`Error subiendo documento al storage: ${error.message}`);
  }
  return path;
}

/** Genera una signed URL temporal para visualizar/descargar un documento. */
export async function signedUrlForDoc(
  path: string,
  expiresInSec: number = SIGNED_URL_TTL_SECONDS,
): Promise<string | null> {
  const { data, error } = await getClient()
    .storage.from(SINIESTROS_BUCKET)
    .createSignedUrl(path, expiresInSec);
  if (error || !data) return null;
  return data.signedUrl;
}
