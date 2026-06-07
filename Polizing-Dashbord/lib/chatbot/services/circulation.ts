import { prisma } from "@/lib/prisma";
import { getProviderForAseguradora } from "@/lib/insurers/registry";

export type CirculationCard = {
  filename: string;
  mime_type: string;
  content_base64: string;
};

export type CirculationCardResponse =
  | { mode: "link"; source_url: string; filename: string; mime_type: string }
  | { mode: "document"; filename: string; mime_type: string; content_base64: string };

export async function getCard(
  clienteId: number,
  policyId: number,
): Promise<CirculationCard | null> {
  const poliza = await prisma.polizas.findFirst({
    where: {
      id: policyId,
      cliente_id: clienteId,
      estado: { in: ["vigente", "proxima"] },
    },
    select: {
      numero_poliza: true,
      tarjeta_circulacion_pdf: true,
      tarjeta_circulacion_mime: true,
    },
  });
  if (!poliza) return null;
  const pdf = poliza.tarjeta_circulacion_pdf;
  if (!pdf) return null;
  const mime = poliza.tarjeta_circulacion_mime ?? "application/pdf";
  const ext = mime.includes("pdf") ? "pdf" : mime.split("/")[1] ?? "bin";
  return {
    filename: `tarjeta-${poliza.numero_poliza}.${ext}`,
    mime_type: mime,
    content_base64: Buffer.from(pdf).toString("base64"),
  };
}

export async function refreshAndGetCard(
  clienteId: number,
  policyId: number,
): Promise<CirculationCardResponse | null> {
  const poliza = await prisma.polizas.findFirst({
    where: {
      id: policyId,
      cliente_id: clienteId,
      estado: { in: ["vigente", "proxima"] },
    },
    select: {
      id: true,
      numero_poliza: true,
      rama: true,
      suplemento: true,
      aseguradora_id: true,
      tarjeta_circulacion_pdf: true,
      tarjeta_circulacion_mime: true,
    },
  });
  if (!poliza) return null;

  try {
    const provider = await getProviderForAseguradora(poliza.aseguradora_id);
    if (!provider.supports("documents")) throw new Error("no documents");

    const parts = poliza.numero_poliza.split("-");
    if (parts.length !== 3) throw new Error("formato numero_poliza inesperado");
    const rama = Number(poliza.rama ?? parts[0]);
    const polizaNum = Number(parts[1]);
    const endoso = Number(poliza.suplemento ?? parts[2] ?? 0);
    if (isNaN(rama) || isNaN(polizaNum)) throw new Error("numero_poliza no numérico");

    const docs = await provider.generateDocuments({
      documentos: ["tarjeta_circulacion"],
      params: { rama, poliza: polizaNum, endoso },
    });
    const doc = docs[0];
    if (!doc?.source_url) throw new Error("Berkley no devolvió source_url");

    const { bytes, mime_type } = await provider.downloadDocument(doc.source_url);
    await prisma.polizas.update({
      where: { id: poliza.id },
      data: { tarjeta_circulacion_pdf: bytes, tarjeta_circulacion_mime: mime_type },
    });

    const ext = mime_type.includes("pdf") ? "pdf" : mime_type.split("/")[1] ?? "bin";
    return {
      mode: "link",
      source_url: doc.source_url,
      filename: doc.filename || `tarjeta-${poliza.numero_poliza}.${ext}`,
      mime_type,
    };
  } catch (err) {
    console.warn("[circulation] refresh desde Berkley fallido, usando caché", err);
    const pdf = poliza.tarjeta_circulacion_pdf;
    if (!pdf) return null;
    const mime = poliza.tarjeta_circulacion_mime ?? "application/pdf";
    const ext = mime.includes("pdf") ? "pdf" : mime.split("/")[1] ?? "bin";
    return {
      mode: "document",
      filename: `tarjeta-${poliza.numero_poliza}.${ext}`,
      mime_type: mime,
      content_base64: Buffer.from(pdf).toString("base64"),
    };
  }
}
