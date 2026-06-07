/**
 * Bootstrap one-shot: trae todos los usuarios YA existentes en Clerk y los
 * sincroniza (upsert por email) en la tabla `usuarios`. El webhook solo dispara
 * en `user.created` de ahora en más; este script cubre las cuentas previas.
 *
 * Cómo correrlo:
 *   npx tsx scripts/sync-clerk-users.ts
 *
 * Requiere CLERK_SECRET_KEY (y DATABASE_URL/DIRECT_URL) en el entorno.
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "../app/generated/prisma/client";
import type { Rol } from "../app/generated/prisma/client";

function createPrisma() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  const pool = new Pool({ connectionString: url });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const prisma = createPrisma();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

function resolveRol(pub: unknown, priv: unknown): Rol {
  const p = (priv as Record<string, unknown> | undefined)?.rol;
  if (p === "administrativo" || p === "productor") return p;
  const role = (pub as Record<string, unknown> | undefined)?.role;
  return role === "Administrativo" ? "administrativo" : "productor";
}

async function main() {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let offset = 0;
  const limit = 100;

  for (;;) {
    const { data: users } = await clerk.users.getUserList({ limit, offset });
    if (users.length === 0) break;

    for (const u of users) {
      const email =
        u.primaryEmailAddress?.emailAddress ??
        u.emailAddresses[0]?.emailAddress ??
        null;
      if (!email) { skipped++; continue; }

      const nombre = [u.firstName, u.lastName].filter(Boolean).join(" ").trim()
        || email.split("@")[0]
        || email;
      const rol = resolveRol(u.publicMetadata, u.privateMetadata);
      const dni =
        typeof (u.privateMetadata as Record<string, unknown>)?.dni === "string"
          ? ((u.privateMetadata as Record<string, unknown>).dni as string)
          : `clerk:${u.id}`;

      const existing = await prisma.usuarios.findUnique({
        where: { email },
        select: { id: true },
      });

      await prisma.usuarios.upsert({
        where: { email },
        create: { email, dni, nombre_completo: nombre, rol, password_hash: `clerk:${u.id}` },
        update: { nombre_completo: nombre, rol },
      });

      if (existing) { updated++; } else { created++; console.log(`  + ${email} (${rol})`); }
    }

    offset += users.length;
    if (users.length < limit) break;
  }

  console.log(`\nSync completado: ${created} creados, ${updated} actualizados, ${skipped} sin email.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
