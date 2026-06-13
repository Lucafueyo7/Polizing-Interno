import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

// Sirve el comprobante inline (BLOB) de pagos antiguos. Los pagos nuevos usan
// Supabase Storage con signed URLs; esta ruta es solo para compatibilidad.
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const { id: idRaw } = await ctx.params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response("No encontrado", { status: 404 });
  }

  const pago = await prisma.pagos.findUnique({
    where: { id },
    select: {
      comprobante_contenido: true,
      comprobante_mime: true,
      comprobante_nombre: true,
    },
  });
  if (!pago?.comprobante_contenido) {
    return new Response("No encontrado", { status: 404 });
  }

  const filename = pago.comprobante_nombre ?? `comprobante-${id}`;
  return new Response(new Uint8Array(pago.comprobante_contenido), {
    headers: {
      "Content-Type": pago.comprobante_mime ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
