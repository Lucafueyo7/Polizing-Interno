"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function validarPago(id: number): Promise<ActionResult> {
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "ID inválido" };
  }
  try {
    const updated = await prisma.pagos.updateMany({
      where: { id, estado: "pendiente" },
      data: { estado: "validado", fecha_pago: new Date() },
    });
    if (updated.count === 0) {
      return { ok: false, error: "El pago ya no está pendiente." };
    }
    updateTag(CACHE_TAGS.pagos);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo validar el pago." };
  }
}
