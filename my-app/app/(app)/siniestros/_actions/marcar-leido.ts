"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function marcarLeido(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) return;
  const user = await getCurrentUser();
  const audit = user?.id
    ? { modificado_por_id: user.id, modificado_en: new Date() }
    : {};
  const updated = await prisma.siniestros.updateMany({
    where: { id, leido: false },
    data: { leido: true, ...audit },
  });
  if (updated.count > 0) {
    updateTag(CACHE_TAGS.siniestros);
  }
}
