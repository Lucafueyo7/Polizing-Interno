/**
 * Script puntual: siembra SOLO el catálogo de ramas genéricas (las 7 conocidas).
 *
 * - Upsert por `codigo` → idempotente, no duplica.
 * - No toca ninguna otra tabla (no borra datos).
 *
 * Uso:  tsx prisma/seed-ramas.ts
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { normalizePgUrl } from "../lib/utils/db-url";
import { RAMAS_GENERICAS } from "./seed-data";

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DIRECT_URL/DATABASE_URL");

  const pool = new Pool({ connectionString: normalizePgUrl(url) });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    for (const r of RAMAS_GENERICAS) {
      await prisma.ramas_genericas.upsert({
        where: { codigo: r.codigo },
        create: { codigo: r.codigo, nombre: r.nombre },
        update: { nombre: r.nombre },
      });
    }
    const total = await prisma.ramas_genericas.count();
    console.log(`✅ Ramas genéricas sembradas. Total en tabla: ${total}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Seed de ramas falló:", err);
  process.exit(1);
});
