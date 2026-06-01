"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Marca el siniestro como leído por el usuario actual mediante upsert en `siniestro_lecturas`.
 * Si la sesión no tiene un `id` resoluble (ej. demo user no presente en BD), no-op.
 */
export async function marcarLeido(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) return;
  const user = await getCurrentUser();
  if (!user?.id) return;

  await prisma.siniestro_lecturas.upsert({
    where: {
      siniestro_id_usuario_id: { siniestro_id: id, usuario_id: user.id },
    },
    create: { siniestro_id: id, usuario_id: user.id },
    update: { leido_en: new Date() },
  });
  updateTag(CACHE_TAGS.siniestros);
}
