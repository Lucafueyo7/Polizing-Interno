"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";

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
  try {
    await prisma.siniestros.update({
      where: { id },
      data: { leido: true },
    });
    updateTag(CACHE_TAGS.siniestros);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo derivar el siniestro." };
  }
}
