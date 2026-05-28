import { prisma } from "@/lib/prisma";

export type CirculationCard = {
  filename: string;
  mime_type: string;
  content_base64: string;
};

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
