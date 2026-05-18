"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ClienteSchema, type ActionResult, type ClienteInput } from "./schemas";

export async function updateCliente(
  id: number,
  input: ClienteInput,
): Promise<ActionResult> {
  const parsed = ClienteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const existing = await prisma.clientes.findUnique({
    where: { id },
    select: { tipo: true },
  });
  if (!existing) {
    return { ok: false, error: "Cliente no encontrado." };
  }
  const expectedTipo = data.tipo === "corp" ? "corporativo" : "persona";
  if (existing.tipo !== expectedTipo) {
    return {
      ok: false,
      error: "No se puede cambiar el tipo de cliente luego de crearlo.",
    };
  }

  const user = await getCurrentUser();
  const audit = user?.id
    ? { modificado_por_id: user.id, modificado_en: new Date() }
    : {};
  try {
    await prisma.clientes.update({
      where: { id },
      data: {
        email: data.email,
        telefono: data.telefono ?? null,
        direccion: data.direccion ?? null,
        estado: data.estado,
        ...audit,
        ...(data.tipo === "corp"
          ? {
              clientes_corporativos: {
                update: {
                  cuit: data.cuit.replace(/-/g, ""),
                  razon_social: data.razonSocial,
                  contacto_nombre: data.contactoNombre ?? null,
                },
              },
            }
          : {
              clientes_no_corporativos: {
                update: {
                  dni: data.dni.replace(/\./g, ""),
                  nombre: data.nombre,
                  apellido: data.apellido,
                },
              },
            }),
      },
    });

    updateTag(CACHE_TAGS.clientes);
    return { ok: true, id };
  } catch (err) {
    const message =
      err instanceof Error && /unique/i.test(err.message)
        ? data.tipo === "corp"
          ? "Ya existe otro cliente con ese CUIT."
          : "Ya existe otro cliente con ese DNI."
        : "No se pudo actualizar el cliente.";
    return { ok: false, error: message };
  }
}
