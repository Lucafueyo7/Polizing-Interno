"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  SiniestroSchema,
  type ActionResult,
  type SiniestroInput,
} from "./schemas";

export async function createSiniestro(
  input: SiniestroInput,
): Promise<ActionResult> {
  const parsed = SiniestroSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;
  const user = await getCurrentUser();
  const audit = user?.id
    ? { modificado_por_id: user.id, modificado_en: new Date() }
    : {};
  try {
    const created = await prisma.siniestros.create({
      data: {
        ...audit,
        poliza_id: data.polizaId,
        numero: data.numero,
        titulo: data.titulo,
        descripcion_hechos: data.descripcion ?? null,
        fecha_ocurrencia: new Date(`${data.fechaOcurrencia}T00:00:00Z`),
        fecha_reporte: new Date(),
        estado: data.estado,
        leido: false,
      },
      select: { id: true },
    });

    updateTag(CACHE_TAGS.siniestros);
    return { ok: true, id: created.id };
  } catch (err) {
    const message =
      err instanceof Error && /unique/i.test(err.message)
        ? "Ya existe un siniestro con ese número."
        : "No se pudo crear el siniestro.";
    return { ok: false, error: message };
  }
}
