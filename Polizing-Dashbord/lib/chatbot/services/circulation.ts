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
      raw_berkley: true,
    },
  });
  if (!poliza) return null;

  try {
    const provider = await getProviderForAseguradora(poliza.aseguradora_id);
    if (!provider.supports("documents")) throw new Error("no documents");

    // Extraer parámetros Berkley: preferir raw_berkley (más fiable que parsear numero_poliza)
    const raw = poliza.raw_berkley as { rama?: string; poliza?: string } | null;
    const rama = Number(raw?.rama ?? poliza.rama);
    const polizaNum = raw?.poliza ? Number(raw.poliza) : (() => {
      const parts = poliza.numero_poliza.split("-");
      return parts.length >= 2 ? Number(parts[1]) : Number(parts[0]);
    })();
    const endoso = Number(poliza.suplemento ?? 0);
    if (isNaN(rama) || isNaN(polizaNum)) throw new Error("no se pudieron determinar los parámetros Berkley");

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
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn("[circulation] refresh desde Berkley fallido, usando caché. Error:", errMsg, err);
    const pdf = poliza.tarjeta_circulacion_pdf;
    if (!pdf) throw err; // DEBUG: exponer error cuando no hay caché
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
