"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";

export async function marcarLeido(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) return;
  const updated = await prisma.siniestros.updateMany({
    where: { id, leido: false },
    data: { leido: true },
  });
  if (updated.count > 0) {
    updateTag(CACHE_TAGS.siniestros);
  }
}
