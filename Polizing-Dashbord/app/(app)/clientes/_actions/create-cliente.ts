"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ClienteSchema, type ActionResult, type ClienteInput } from "./schemas";

export async function createCliente(input: ClienteInput): Promise<ActionResult> {
  const parsed = ClienteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const user = await getCurrentUser();
  const audit = user?.id
    ? { modificado_por_id: user.id, modificado_en: new Date() }
    : {};
  try {
    const created = await prisma.clientes.create({
      data: {
        tipo: data.tipo === "corp" ? "corporativo" : "persona",
        email: data.email,
        telefono: data.telefono ?? null,
        direccion: data.direccion ?? null,
        estado: data.estado,
        ...audit,
        ...(data.tipo === "corp"
          ? {
              clientes_corporativos: {
                create: {
                  cuit: data.cuit.replace(/-/g, ""),
                  razon_social: data.razonSocial,
                  contacto_nombre: data.contactoNombre ?? null,
                },
              },
            }
          : {
              clientes_no_corporativos: {
                create: {
                  dni: data.dni.replace(/\./g, ""),
                  nombre: data.nombre,
                  apellido: data.apellido,
                },
              },
            }),
      },
      select: { id: true },
    });

    updateTag(CACHE_TAGS.clientes);
    return { ok: true, id: created.id };
  } catch (err) {
    const message =
      err instanceof Error && /unique/i.test(err.message)
        ? data.tipo === "corp"
          ? "Ya existe un cliente con ese CUIT."
          : "Ya existe un cliente con ese DNI."
        : "No se pudo crear el cliente.";
    return { ok: false, error: message };
  }
}
