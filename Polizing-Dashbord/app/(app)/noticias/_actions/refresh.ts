"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { refreshSnapshot } from "@/lib/data/noticias";

export async function refreshNoticias() {
  await refreshSnapshot();
  updateTag(CACHE_TAGS.noticias);
}
