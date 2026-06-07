/**
 * Migración one-shot: sube los documentos de siniestros ya guardados como
 * bytes en la columna `contenido` al bucket de Supabase Storage
 * `siniestros_documentos`, y escribe el path resultante en `url`.
 *
 * La columna `contenido` NO se borra: queda como fallback hasta que se
 * confirme que todos los docs son accesibles desde el bucket.
 *
 * Cómo correrlo:
 *   tsx scripts/migrate-siniestro-docs-to-storage.ts
 *
 * Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "siniestros_documentos";

function createPrisma() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  const pool = new Pool({ connectionString: url });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

function createStorage() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const prisma = createPrisma();
const supabase = createStorage();

async function main() {
  const docs = await prisma.siniestro_documentos.findMany({
    where: {
      contenido: { not: null },
      url: null,
    },
    include: {
      siniestro: { select: { numero: true } },
    },
    orderBy: { id: "asc" },
  });

  console.log(`Documentos a migrar: ${docs.length}`);
  if (docs.length === 0) {
    console.log("Nada que migrar.");
    return;
  }

  let ok = 0;
  let err = 0;

  for (const doc of docs) {
    if (!doc.contenido) continue;
    const path = `${doc.siniestro.numero}/${doc.id}-${sanitize(doc.nombre)}`;

    try {
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, new Uint8Array(doc.contenido), {
          contentType: doc.mime_type,
          upsert: false,
        });
      if (error) throw new Error(error.message);

      await prisma.siniestro_documentos.update({
        where: { id: doc.id },
        data: { url: path },
      });
      console.log(`  ✓ doc #${doc.id} → ${path}`);
      ok++;
    } catch (e) {
      console.error(`  ✗ doc #${doc.id}: ${(e as Error).message}`);
      err++;
    }
  }

  console.log(`\nMigración completada: ${ok} OK, ${err} con error.`);
}

function sanitize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
