/** Normalización de respuestas de Federación Patronal a DTOs de dominio. */

import type { CarteraCliente, DocumentoTipo, GeneratedDocument } from "../../types";
import type { ReporteResponse } from "./client";

const str = (v: unknown): string | undefined =>
  v === null || v === undefined || v === "" ? undefined : String(v);

/** Convierte un reporte (PDF en base64, posiblemente en varios chunks) a documento. */
export function reporteToDocument(
  tipo: DocumentoTipo,
  reporte: ReporteResponse,
): GeneratedDocument {
  const content = (reporte.reporte ?? []).join("");
  const isPdf = (reporte.desFormat ?? "PDF").toUpperCase().includes("PDF");
  const mime = isPdf ? "application/pdf" : "application/octet-stream";
  const ext = isPdf ? "pdf" : "bin";
  const base = reporte.nombreReporte?.trim() || tipo;
  return {
    tipo,
    filename: `${base}.${ext}`,
    mime_type: mime,
    content_base64: content,
  };
}

/** Mapea una fila de `/cartera/clientes` al DTO de cartera. */
export function carteraClienteToDto(row: Record<string, unknown>): CarteraCliente {
  return {
    documento: str(row.numero_documento),
    nombre: str(row.nombre),
    cuit: str(row.cuit),
    email: str(row.email),
    telefono: str(row.telefono_p) ?? str(row.telefono_s),
    raw: row,
  };
}
