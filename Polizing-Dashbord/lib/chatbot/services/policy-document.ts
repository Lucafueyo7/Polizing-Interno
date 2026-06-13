import { prisma } from "@/lib/prisma";
import { getProviderForAseguradora } from "@/lib/insurers/registry";

export type PolicyDocumentResponse = {
  mode: "link";
  source_url: string;
  filename: string;
  mime_type: string;
};

/**
 * Obtiene la póliza completa (PDF) desde Berkley (`CopiaPoliza`). Espeja a
 * `refreshAndGetCard`: intenta en vivo y cachea el link en `polizas.poliza_pdf`,
 * con fallback al caché si la aseguradora falla. Mismas restricciones que la
 * tarjeta de circulación (póliza vigente y del cliente).
 */
export async function refreshAndGetPolicyDoc(
  clienteId: number,
  policyId: number,
): Promise<PolicyDocumentResponse | null> {
  const poliza = await prisma.polizas.findFirst({
    where: {
      id: policyId,
      cliente_id: clienteId,
      estado: { in: ["vigente"] },
    },
    select: {
      id: true,
      numero_poliza: true,
      rama: true,
      suplemento: true,
      aseguradora_id: true,
      poliza_pdf: true,
      raw_berkley: true,
    },
  });
  if (!poliza) return null;

  const mime = "application/pdf";
  const fallbackFilename = `poliza-${poliza.numero_poliza}.pdf`;

  try {
    const provider = await getProviderForAseguradora(poliza.aseguradora_id);
    if (!provider.supports("documents")) throw new Error("no documents");

    const raw = poliza.raw_berkley as { rama?: string; poliza?: string } | null;
    const rama = Number(raw?.rama ?? poliza.rama);
    const polizaNum = raw?.poliza
      ? Number(raw.poliza)
      : (() => {
          const parts = poliza.numero_poliza.split("-");
          return parts.length >= 2 ? Number(parts[1]) : Number(parts[0]);
        })();
    const endoso = Number(poliza.suplemento ?? 0);
    if (isNaN(rama) || isNaN(polizaNum)) throw new Error("no se pudieron determinar los parámetros Berkley");

    const docs = await provider.generateDocuments({
      documentos: ["poliza"],
      params: { rama, poliza: polizaNum, endoso },
    });
    const doc = docs[0];
    if (!doc?.source_url) throw new Error("Berkley no devolvió source_url");

    await prisma.polizas.update({
      where: { id: poliza.id },
      data: { poliza_pdf: doc.source_url, poliza_mime: mime },
    });

    return {
      mode: "link",
      source_url: doc.source_url,
      filename: doc.filename || fallbackFilename,
      mime_type: mime,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn("[policy-document] refresh desde Berkley fallido, usando caché. Error:", errMsg);
    const cachedUrl = poliza.poliza_pdf;
    if (!cachedUrl) return null;
    return {
      mode: "link",
      source_url: cachedUrl,
      filename: fallbackFilename,
      mime_type: mime,
    };
  }
}
