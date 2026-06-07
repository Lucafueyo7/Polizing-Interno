"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  UpdateUsuarioSchema,
  type ActionResult,
  type UpdateUsuarioInput,
} from "./schemas";

export async function updateUsuario(
  input: UpdateUsuarioInput,
): Promise<ActionResult> {
  const parsed = UpdateUsuarioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "Productor") {
    return { ok: false, error: "No tenés permiso para editar usuarios." };
  }

  const { id, nombreCompleto, rol } = parsed.data;

  const dbUser = await prisma.usuarios.findUnique({
    where: { id },
    select: { rol: true, password_hash: true },
  });
  if (!dbUser) return { ok: false, error: "Usuario no encontrado." };

  await prisma.usuarios.update({
    where: { id },
    data: { nombre_completo: nombreCompleto, rol },
  });

  if (dbUser.password_hash.startsWith("clerk:")) {
    const clerkId = dbUser.password_hash.replace("clerk:", "");
    const [firstName, ...rest] = nombreCompleto.trim().split(" ");
    try {
      const clerk = await clerkClient();
      await clerk.users.updateUser(clerkId, {
        firstName: firstName ?? nombreCompleto,
        lastName: rest.join(" ") || undefined,
        publicMetadata: {
          role: rol === "administrativo" ? "Administrativo" : "Productor",
        },
      });
    } catch {
      // La sync de Clerk falló pero la BD ya quedó actualizada.
    }
  }

  return { ok: true };
}
