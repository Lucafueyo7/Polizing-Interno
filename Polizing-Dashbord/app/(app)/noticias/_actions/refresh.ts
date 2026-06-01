"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";

export async function refreshNoticias() {
  updateTag(CACHE_TAGS.noticias);
}
