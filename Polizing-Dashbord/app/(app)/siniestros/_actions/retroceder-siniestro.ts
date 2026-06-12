"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

type RetrocesoDestino = "nuevo" | "en_tramite";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

const TRANSICIONES: Record<string, RetrocesoDestino> = {
  en_tramite: "nuevo",
  cerrado: "en_tramite",
};

export async function retrocederSiniestro(id: number, desde: string): Promise<ActionResult> {
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "ID inválido" };
  }

  const destino = TRANSICIONES[desde];
  if (!destino) {
    return { ok: false, error: `No se puede retroceder desde '${desde}'.` };
  }

  const user = await getCurrentUser();
  const audit = user?.id
    ? { modificado_por_id: user.id, modificado_en: new Date() }
    : {};

  try {
    const updated = await prisma.siniestros.updateMany({
      where: { id, estado: desde },
      data: { estado: destino, ...audit },
    });
    if (updated.count === 0) {
      return { ok: false, error: `El siniestro ya no está en estado '${desde}'.` };
    }

    if (user?.id) {
      await prisma.siniestro_lecturas.upsert({
        where: {
          siniestro_id_usuario_id: { siniestro_id: id, usuario_id: user.id },
        },
        create: { siniestro_id: id, usuario_id: user.id },
        update: { leido_en: new Date() },
      });
    }

    updateTag(CACHE_TAGS.siniestros);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo retroceder el siniestro." };
  }
}
