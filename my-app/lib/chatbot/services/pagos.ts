import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { buildPayReference } from "../ids";
import type { DecodedFile } from "../files";

// Invariante: pago con `monto=0` + `estado=pendiente` + `comprobante_contenido!=null`
// proviene del chatbot. El productor valida y completa el monto desde el panel.
export async function createFromReceipt(args: {
  clienteId: number;
  policyId: number;
  file: DecodedFile;
}): Promise<{ reference: string; status: "ok" }> {
  const { clienteId, policyId, file } = args;
  const pago = await prisma.$transaction(async (tx) => {
    const created = await tx.pagos.create({
      data: {
        cliente_id: clienteId,
        monto: 0,
        estado: "pendiente",
        comprobante_nombre: file.filename,
        comprobante_mime: file.mime,
        comprobante_contenido: new Uint8Array(file.bytes),
      },
      select: { id: true },
    });
    await tx.polizas.update({
      where: { id: policyId },
      data: { pago_id: created.id },
    });
    return created;
  });
  revalidateTag(CACHE_TAGS.pagos, "minutes");
  revalidateTag(CACHE_TAGS.polizas, "minutes");
  return { reference: buildPayReference(pago.id), status: "ok" };
}
