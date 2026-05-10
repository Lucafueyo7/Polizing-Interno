"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function aprobarTramite(id: number): Promise<ActionResult> {
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "ID inválido" };
  }
  try {
    const updated = await prisma.siniestros.updateMany({
      where: { id, estado: "nuevo" },
      data: { estado: "tramite", leido: true },
    });
    if (updated.count === 0) {
      return { ok: false, error: "El siniestro ya no está en estado 'nuevo'." };
    }
    updateTag(CACHE_TAGS.siniestros);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo aprobar el trámite." };
  }
}
