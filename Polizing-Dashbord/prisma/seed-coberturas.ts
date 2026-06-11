/**
 * Script puntual: siembra SOLO el catálogo de coberturas genéricas.
 *
 * - Upsert por `codigo` → idempotente, no duplica.
 * - No toca ninguna otra tabla (no borra datos).
 *
 * Uso:  tsx prisma/seed-coberturas.ts
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { normalizePgUrl } from "../lib/utils/db-url";
import { COBERTURAS_GENERICAS } from "./seed-data";

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DIRECT_URL/DATABASE_URL");

  const pool = new Pool({ connectionString: normalizePgUrl(url) });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    for (const c of COBERTURAS_GENERICAS) {
      await prisma.coberturas_genericas.upsert({
        where: { codigo: c.codigo },
        create: { codigo: c.codigo, nombre: c.nombre },
        update: { nombre: c.nombre },
      });
    }
    const total = await prisma.coberturas_genericas.count();
    console.log(`✅ Coberturas genéricas sembradas. Total en tabla: ${total}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Seed de coberturas falló:", err);
  process.exit(1);
});
