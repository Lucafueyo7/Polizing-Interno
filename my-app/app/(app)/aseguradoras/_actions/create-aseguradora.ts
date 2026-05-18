"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  AseguradoraSchema,
  type ActionResult,
  type AseguradoraInput,
} from "./schemas";

export async function createAseguradora(
  input: AseguradoraInput,
): Promise<ActionResult> {
  const parsed = AseguradoraSchema.safeParse(input);
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
    const created = await prisma.empresas_aseguradoras.create({
      data: {
        ...audit,
        razon_social: data.razonSocial,
        cuit: data.cuit.replace(/-/g, ""),
        contacto_nombre: data.contactoNombre ?? null,
        email: data.email ?? null,
        telefono: data.telefono ?? null,
        direccion: data.direccion ?? null,
      },
      select: { id: true },
    });

    updateTag(CACHE_TAGS.aseguradoras);
    return { ok: true, id: created.id };
  } catch (err) {
    const message =
      err instanceof Error && /unique/i.test(err.message)
        ? "Ya existe una aseguradora con ese CUIT."
        : "No se pudo crear la aseguradora.";
    return { ok: false, error: message };
  }
}
