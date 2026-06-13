import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { uploadPagoDoc } from "@/lib/storage/supabase";
import { buildPayReference } from "../ids";
import type { DecodedFile } from "../files";

// Invariante: pago con `monto=0` + `estado=pendiente` proveniente del chatbot.
// El productor valida y completa el monto desde el panel. Un comprobante puede
// incluir varios archivos y cubrir varias pólizas del mismo cliente.
export async function createFromReceipts(args: {
  clienteId: number;
  policyIds: number[];
  files: DecodedFile[];
}): Promise<{ reference: string; status: "ok" }> {
  const { clienteId, policyIds, files } = args;

  // Subimos al bucket ANTES de la transacción: si falla una subida, abortamos
  // sin dejar el pago creado. La carpeta se nombra con un id temporal estable.
  const folder = `${clienteId}-${Date.now()}`;
  const uploaded = await Promise.all(
    files.map(async (f, i) => ({
      file: f,
      path: await uploadPagoDoc(
        `${folder}/${i}-${sanitizeFilename(f.filename)}`,
        new Uint8Array(f.bytes),
        f.mime,
      ),
    })),
  );

  const pago = await prisma.$transaction(async (tx) => {
    const created = await tx.pagos.create({
      data: { cliente_id: clienteId, monto: 0, estado: "pendiente" },
      select: { id: true },
    });
    await tx.pago_documentos.createMany({
      data: uploaded.map(({ file, path }) => ({
        pago_id: created.id,
        tipo: file.mime.startsWith("image/") ? ("img" as const) : ("pdf" as const),
        nombre: file.filename,
        mime_type: file.mime,
        tamano_bytes: file.size,
        url: path,
      })),
    });
    await tx.polizas.updateMany({
      where: { id: { in: policyIds } },
      data: { pago_id: created.id },
    });
    // Histórico many-to-many: preserva la relación aunque la misma póliza se
    // pague múltiples veces (polizas.pago_id solo guarda el último pago).
    await tx.pago_polizas.createMany({
      data: policyIds.map((poliza_id) => ({
        pago_id: created.id,
        poliza_id,
      })),
    });
    return created;
  });

  revalidateTag(CACHE_TAGS.pagos, "minutes");
  revalidateTag(CACHE_TAGS.polizas, "minutes");
  return { reference: buildPayReference(pago.id), status: "ok" };
}

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}
