"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { CreateUsuarioSchema, type ActionResult, type CreateUsuarioInput } from "./schemas";

export async function createUsuario(input: CreateUsuarioInput): Promise<ActionResult> {
  const parsed = CreateUsuarioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Solo productores pueden crear usuarios.
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "Productor") {
    return { ok: false, error: "No tenés permiso para crear usuarios." };
  }

  const { nombre, apellido, email, dni, rol, password } = parsed.data;
  const nombreCompleto = `${nombre} ${apellido}`;
  const dniNormalizado = dni.replace(/\./g, "");

  // Verificar unicidad en la BD antes de crear en Clerk.
  const existente = await prisma.usuarios.findFirst({
    where: { OR: [{ email }, { dni: dniNormalizado }] },
    select: { id: true, email: true, dni: true },
  });
  if (existente) {
    const campo = existente.email === email ? "email" : "DNI";
    return { ok: false, error: `Ya existe un usuario con ese ${campo}.` };
  }

  // Crear en Clerk. El DNI y el rol viajan en privateMetadata para que el
  // webhook `user.created` pueda poblar la tabla `usuarios` con esos datos.
  let clerkId: string;
  try {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.createUser({
      emailAddress: [email],
      password,
      firstName: nombre,
      lastName: apellido,
      publicMetadata: { role: rol === "administrativo" ? "Administrativo" : "Productor" },
      privateMetadata: { dni: dniNormalizado, rol },
    });
    clerkId = clerkUser.id;
  } catch (e: unknown) {
    if (isClerkAPIResponseError(e)) {
      const detail = e.errors.map((err) => err.longMessage || err.message).join(". ");
      return { ok: false, error: detail || e.message };
    }
    const msg = e instanceof Error ? e.message : "Error al crear el usuario en Clerk.";
    return { ok: false, error: msg };
  }

  // Upsert en la BD local. Es idempotente con el webhook (que también escribe
  // en `user.created`): el que llegue segundo no falla.
  try {
    await prisma.usuarios.upsert({
      where: { email },
      create: {
        email,
        dni: dniNormalizado,
        nombre_completo: nombreCompleto,
        rol: rol === "administrativo" ? "administrativo" : "productor",
        // La autenticación es gestionada por Clerk; guardamos el ID de Clerk como referencia.
        password_hash: `clerk:${clerkId}`,
      },
      update: {
        nombre_completo: nombreCompleto,
        rol: rol === "administrativo" ? "administrativo" : "productor",
      },
    });
  } catch {
    // No eliminamos el usuario de Clerk: el webhook reintentará la sincronización.
    return { ok: false, error: "Usuario creado en Clerk, pero falló el guardado en la base. Reintentá o revisá el webhook." };
  }

  return { ok: true };
}
