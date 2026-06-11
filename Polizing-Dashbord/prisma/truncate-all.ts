/**
 * Script puntual: vacía TODAS las tablas de dominio del esquema public.
 *
 * - TRUNCATE ... RESTART IDENTITY CASCADE → borra los datos y reinicia los
 *   contadores de autoincrement.
 * - Mantiene el esquema y las migraciones (excluye `_prisma_migrations`).
 * - Usa DIRECT_URL (puerto 5432) para evitar el pooler pgbouncer.
 *
 * Uso:  tsx prisma/truncate-all.ts
 */

import "dotenv/config";
import { Client } from "pg";

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DIRECT_URL / DATABASE_URL");

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    const { rows } = await client.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables
       WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
    );

    if (rows.length === 0) {
      console.log("No hay tablas para vaciar.");
      return;
    }

    const tables = rows
      .map((r) => `"public"."${r.tablename}"`)
      .join(", ");

    console.log(`Vaciando ${rows.length} tablas:`);
    for (const r of rows) console.log(`  - ${r.tablename}`);

    await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);

    console.log("\n✅ Todas las tablas fueron vaciadas (IDs reiniciados).");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ Error vaciando la base:", err);
  process.exit(1);
});
