/**
 * Singleton de Prisma Client para Next.js.
 *
 * Prisma 7 requiere un Driver Adapter para conectar a la base. Usamos
 * `PrismaPg` con el pool de `pg` apuntando al pooler de Supabase
 * (`DATABASE_URL`, puerto 6543, pgbouncer). Las migraciones usan `DIRECT_URL`
 * vía `prisma.config.ts` — el runtime nunca habla con el puerto 5432.
 *
 * La instancia se comparte en `globalThis` para evitar abrir múltiples pools
 * durante el hot-reload de Next.js en desarrollo.
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { normalizePgUrl } from "./utils/db-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  const pool = new Pool({ connectionString: normalizePgUrl(url) });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
