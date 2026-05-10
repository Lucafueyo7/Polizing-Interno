"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import {
  AseguradoraSchema,
  type ActionResult,
  type AseguradoraInput,
} from "./schemas";

export async function updateAseguradora(
  id: number,
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

  try {
    await prisma.empresas_aseguradoras.update({
      where: { id },
      data: {
        razon_social: data.razonSocial,
        cuit: data.cuit.replace(/-/g, ""),
        contacto_nombre: data.contactoNombre ?? null,
        email: data.email ?? null,
        telefono: data.telefono ?? null,
        direccion: data.direccion ?? null,
      },
    });

    updateTag(CACHE_TAGS.aseguradoras);
    return { ok: true, id };
  } catch (err) {
    const message =
      err instanceof Error && /unique/i.test(err.message)
        ? "Ya existe otra aseguradora con ese CUIT."
        : "No se pudo actualizar la aseguradora.";
    return { ok: false, error: message };
  }
}
