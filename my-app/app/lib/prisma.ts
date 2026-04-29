/**
 * Singleton de Prisma Client para Next.js
 *
 * Prisma 7 requiere un Driver Adapter para conectarse a la base de datos.
 * Usamos PrismaPg con el pool de conexiones de `pg` apuntando a Supabase.
 *
 * La instancia se comparte en globalThis para evitar múltiples
 * conexiones durante el hot-reload de Next.js en desarrollo.
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Tipado del global para evitar "no existe en globalThis"
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
