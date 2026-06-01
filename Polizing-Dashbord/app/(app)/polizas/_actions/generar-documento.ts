"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { getProviderForAseguradora } from "@/lib/insurers/registry";
import { InsurerError } from "@/lib/insurers/errors";
import type { DocumentoTipo, GeneratedDocument } from "@/lib/insurers/types";

export type GenerarDocumentoResult =
  | { ok: true; documentos: GeneratedDocument[] }
  | { ok: false; error: string };

/**
 * Genera documentos vía la integración de la aseguradora de la póliza. Protegido
 * por Clerk (`getCurrentUser`). Los parámetros específicos del proveedor
 * (rama/poliza/endoso para Berkley; sucursal/ramo/... para Fed.Patronal) los
 * provee el operador en la UI, porque no se almacenan en el modelo de pólizas.
 */
export async function generarDocumentoPoliza(input: {
  aseguradoraId: number;
  documentos: DocumentoTipo[];
  params: Record<string, string | number>;
}): Promise<GenerarDocumentoResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No autorizado" };

  if (input.documentos.length === 0) {
    return { ok: false, error: "Seleccioná al menos un documento" };
  }

  try {
    const provider = await getProviderForAseguradora(input.aseguradoraId);
    if (!provider.supports("documents")) {
      return { ok: false, error: `${provider.displayName} no genera documentos` };
    }
    const documentos = await provider.generateDocuments({
      documentos: input.documentos,
      params: input.params,
    });
    return { ok: true, documentos };
  } catch (err) {
    if (err instanceof InsurerError) return { ok: false, error: err.message };
    console.error("[generarDocumentoPoliza]", err);
    return { ok: false, error: "No se pudo generar el documento" };
  }
}
