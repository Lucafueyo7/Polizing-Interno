"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";

// Invalida los tags de los getters que alimentan el dashboard para que el
// botón "Actualizar" traiga datos frescos (no alcanza con router.refresh(),
// que no invalida el data cache).
export async function refreshDashboard(): Promise<void> {
  for (const tag of [
    CACHE_TAGS.kpis,
    CACHE_TAGS.actividad,
    CACHE_TAGS.siniestros,
    CACHE_TAGS.pagos,
    CACHE_TAGS.polizas,
    CACHE_TAGS.clientes,
  ]) {
    updateTag(tag);
  }
}
