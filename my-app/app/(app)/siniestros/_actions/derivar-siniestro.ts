"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * MVP: marca el siniestro como leído al derivar y revalida.
 * En siguientes etapas cuando exista una tabla de auditoría / asignación,
 * se registra el evento y se notifica a la aseguradora.
 */
export async function derivarSiniestro(id: number): Promise<ActionResult> {
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "ID inválido" };
  }
  const user = await getCurrentUser();
  const audit = user?.id
    ? { modificado_por_id: user.id, modificado_en: new Date() }
    : {};
  try {
    await prisma.siniestros.update({
      where: { id },
      data: { leido: true, ...audit },
    });
    updateTag(CACHE_TAGS.siniestros);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo derivar el siniestro." };
  }
}
