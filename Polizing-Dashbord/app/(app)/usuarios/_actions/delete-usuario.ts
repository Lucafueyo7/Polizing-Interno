"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import type { ActionResult } from "./schemas";

export async function deleteUsuario(id: number): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "Productor") {
    return { ok: false, error: "No tenés permiso para eliminar usuarios." };
  }

  const dbUser = await prisma.usuarios.findUnique({
    where: { id },
    select: { rol: true, password_hash: true },
  });
  if (!dbUser) return { ok: false, error: "Usuario no encontrado." };

  if (dbUser.password_hash.startsWith("clerk:")) {
    const clerkId = dbUser.password_hash.replace("clerk:", "");
    try {
      const clerk = await clerkClient();
      await clerk.users.deleteUser(clerkId);
    } catch {
      // Si Clerk falla (ej. ya fue eliminado), continuamos con el borrado en BD.
    }
  }

  await prisma.usuarios.delete({ where: { id } });
  return { ok: true };
}
