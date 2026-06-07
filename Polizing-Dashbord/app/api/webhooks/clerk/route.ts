/**
 * Webhook de Clerk. Mantiene la tabla `usuarios` sincronizada con Clerk:
 *  - `user.created` / `user.updated` → upsert del usuario en la BD (por email).
 *  - `user.deleted`                  → baja del usuario en la BD.
 *
 * La firma se verifica con `verifyWebhook` (svix) usando la env
 * `CLERK_WEBHOOK_SIGNING_SECRET`. La ruta es pública (ver `proxy.ts`): la llama
 * Clerk server-to-server, sin sesión.
 */

import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/prisma";
import type { Rol } from "@/app/generated/prisma/client";

type ClerkEmail = { id: string; email_address: string };
type ClerkUserData = {
  id: string;
  email_addresses?: ClerkEmail[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  public_metadata?: Record<string, unknown>;
  private_metadata?: Record<string, unknown>;
};

function primaryEmail(data: ClerkUserData): string | null {
  const list = data.email_addresses ?? [];
  const primary = list.find((e) => e.id === data.primary_email_address_id);
  return (primary ?? list[0])?.email_address ?? null;
}

function resolveRol(data: ClerkUserData): Rol {
  const priv = data.private_metadata?.rol;
  if (priv === "administrativo" || priv === "productor") return priv;
  return data.public_metadata?.role === "Administrativo" ? "administrativo" : "productor";
}

function resolveDni(data: ClerkUserData): string {
  const dni = data.private_metadata?.dni;
  return typeof dni === "string" && dni.trim() ? dni.trim() : `clerk:${data.id}`;
}

function resolveNombre(data: ClerkUserData, email: string): string {
  const full = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
  return full || email.split("@")[0] || email;
}

export async function POST(req: NextRequest): Promise<Response> {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response("Firma de webhook inválida", { status: 400 });
  }

  try {
    if (evt.type === "user.created" || evt.type === "user.updated") {
      const data = evt.data as unknown as ClerkUserData;
      const email = primaryEmail(data);
      if (!email) return new Response("Sin email", { status: 200 });

      const nombre_completo = resolveNombre(data, email);
      const rol = resolveRol(data);
      const dni = resolveDni(data);

      await prisma.usuarios.upsert({
        where: { email },
        create: {
          email,
          dni,
          nombre_completo,
          rol,
          password_hash: `clerk:${data.id}`,
        },
        // No actualizamos dni en conflicto para evitar choques con su unique.
        update: { nombre_completo, rol },
      });
    } else if (evt.type === "user.deleted") {
      const id = (evt.data as { id?: string }).id;
      if (id) {
        await prisma.usuarios.deleteMany({ where: { password_hash: `clerk:${id}` } });
      }
    }
  } catch (e) {
    // Logueamos pero respondemos 200 para no forzar reintentos infinitos de Clerk
    // ante conflictos de datos (ej. dni duplicado).
    console.error("[clerk webhook] error procesando evento:", e);
    return new Response("Error procesado", { status: 200 });
  }

  return new Response("OK", { status: 200 });
}
