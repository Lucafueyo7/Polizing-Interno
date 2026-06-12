"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import type { ActionResult } from "./schemas";

type SyncResult = ActionResult & { data?: { created: number; updated: number } };

export async function syncUsuarios(): Promise<SyncResult> {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "Productor") {
    return { ok: false, error: "No tenés permiso para sincronizar usuarios." };
  }

  try {
    const clerk = await clerkClient();
    let totalCreated = 0;
    let totalUpdated = 0;
    let offset = 0;
    const limit = 100;

    while (true) {
      const users = await clerk.users.getUserList({ limit, offset });
      if (users.data.length === 0) break;

      for (const clerkUser of users.data) {
        const email = clerkUser.primaryEmailAddress?.emailAddress ??
          clerkUser.emailAddresses[0]?.emailAddress;
        if (!email) continue;

        const fullName = [clerkUser.firstName, clerkUser.lastName]
          .filter(Boolean)
          .join(" ");
        const nombreCompleto = fullName || email.split("@")[0];

        const metadataRole = clerkUser.publicMetadata?.role;
        const rol = metadataRole === "Administrativo" ? "administrativo"
          : metadataRole === "Productor" ? "productor"
          : "sin_acceso";

        const clerkDni = (clerkUser.publicMetadata?.dni as string | undefined)
          ?? (clerkUser.privateMetadata?.dni as string | undefined)
          ?? (clerkUser.unsafeMetadata?.dni as string | undefined);
        const dni = clerkDni?.trim() || null;

        const existing = await prisma.usuarios.findUnique({
          where: { email },
          select: { id: true, nombre_completo: true },
        });

        if (existing) {
          if (existing.nombre_completo !== nombreCompleto) {
            await prisma.usuarios.update({
              where: { email },
              data: { nombre_completo: nombreCompleto },
            });
            totalUpdated++;
          }
        } else {
          const clerkId = clerkUser.id;
          await prisma.usuarios.create({
            data: {
              email,
              nombre_completo: nombreCompleto,
              dni,
              password_hash: `clerk:${clerkId}`,
              rol: rol as "productor" | "administrativo" | "sin_acceso",
            },
          });
          totalCreated++;
        }
      }

      offset += limit;
      if (users.data.length < limit) break;
    }

    updateTag(CACHE_TAGS.usuarios);
    return { ok: true, data: { created: totalCreated, updated: totalUpdated } };
  } catch (error) {
    console.error("Error syncing users:", error);
    return { ok: false, error: "Error al sincronizar usuarios con Clerk." };
  }
}
