/**
 * Cliente de Supabase Storage (solo server-side).
 *
 * Usa la `service_role` key, que bypassea las RLS policies del bucket: por eso
 * NUNCA debe importarse desde código cliente. Los buckets `siniestros_documentos`
 * y `pagos_comprobantes` son privados; los archivos se sirven mediante signed URLs.
 */

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SINIESTROS_BUCKET = "siniestros_documentos";
export const PAGOS_BUCKET = "pagos_comprobantes";

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
  return uploadDoc(SINIESTROS_BUCKET, path, bytes, mime);
}

/**
 * Sube un comprobante de pago al bucket y devuelve el path almacenado
 * (lo que guardamos en `pago_documentos.url`).
 */
export async function uploadPagoDoc(
  path: string,
  bytes: Uint8Array,
  mime: string,
): Promise<string> {
  return uploadDoc(PAGOS_BUCKET, path, bytes, mime);
}

async function uploadDoc(
  bucket: string,
  path: string,
  bytes: Uint8Array,
  mime: string,
): Promise<string> {
  const { error } = await getClient()
    .storage.from(bucket)
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (error) {
    throw new Error(`Error subiendo documento al storage: ${error.message}`);
  }
  return path;
}

/**
 * Genera una signed URL temporal para un documento.
 * Si `download` es un string, la URL fuerza la descarga con ese nombre de archivo
 * (Content-Disposition: attachment); si es undefined, la URL es para visualizar.
 * `bucket` permite elegir el contenedor (default: siniestros).
 */
export async function signedUrlForDoc(
  path: string,
  options: { expiresInSec?: number; download?: string; bucket?: string } = {},
): Promise<string | null> {
  const { expiresInSec = SIGNED_URL_TTL_SECONDS, download, bucket = SINIESTROS_BUCKET } = options;
  const { data, error } = await getClient()
    .storage.from(bucket)
    .createSignedUrl(path, expiresInSec, download ? { download } : undefined);
  if (error || !data) return null;
  return data.signedUrl;
}
