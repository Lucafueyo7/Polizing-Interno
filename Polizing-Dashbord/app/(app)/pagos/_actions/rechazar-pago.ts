"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function rechazarPago(id: number): Promise<ActionResult> {
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "ID inválido" };
  }
  const user = await getCurrentUser();
  const audit = user?.id
    ? { modificado_por_id: user.id, modificado_en: new Date() }
    : {};
  try {
    const updated = await prisma.pagos.updateMany({
      where: { id, estado: "pendiente" },
      data: { estado: "rechazado", ...audit },
    });
    if (updated.count === 0) {
      return { ok: false, error: "El pago ya no está pendiente." };
    }
    updateTag(CACHE_TAGS.pagos);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo rechazar el pago." };
  }
}
