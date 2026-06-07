/**
 * Migración one-shot: mueve los datos de `berkley_cartera_clientes` y
 * `berkley_cartera_polizas` a las tablas de dominio `clientes` y `polizas`.
 *
 * Debe correrse ANTES de eliminar los modelos berkley_cartera_* del schema.
 *
 * Cómo correrlo:
 *   tsx scripts/migrate-berkley-cartera.ts
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../app/generated/prisma/client";

function createPrisma() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  const pool = new Pool({ connectionString: url });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}
const prisma = createPrisma();

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

async function migrateClientes() {
  const rows = await prisma.berkley_cartera_clientes.findMany();
  console.log(`\n[clientes] Registros en cartera: ${rows.length}`);

  let creados = 0;
  let vinculados = 0;
  let omitidos = 0;

  for (const r of rows) {
    const codigo = r.codigo_asegurado;

    // ¿Ya migrado?
    const yaMigrado = await prisma.clientes.findUnique({
      where: { codigo_asegurado_berkley: codigo },
      select: { id: true },
    });
    if (yaMigrado) { omitidos++; continue; }

    const esCorporativo = !!(r.cuit && r.cuit.trim());
    const tipo: "corporativo" | "persona" = esCorporativo ? "corporativo" : "persona";

    // Intentar crear.
    try {
      const nuevo = await prisma.clientes.create({
        data: {
          tipo,
          email: r.email ?? null,
          telefono: r.telefono ?? null,
          codigo_asegurado_berkley: codigo,
          raw_berkley: r.raw as Prisma.InputJsonValue,
          fecha_alta: new Date(),
        },
        select: { id: true },
      });
      await upsertSubtable(nuevo.id, esCorporativo, r);
      creados++;
      console.log(`  ✓ cliente ${codigo} → #${nuevo.id}`);
    } catch {
      // Colisión cuit/dni: intentar vincular cliente existente.
      const vinculado = await vincularExistente(codigo, esCorporativo, r);
      if (vinculado) {
        vinculados++;
        console.log(`  ~ cliente ${codigo} vinculado al existente`);
      } else {
        omitidos++;
        console.warn(`  ✗ cliente ${codigo} no migrado (sin match)`);
      }
    }
  }

  console.log(`  → creados: ${creados}, vinculados: ${vinculados}, omitidos/skip: ${omitidos}`);
}

async function upsertSubtable(
  clienteId: number,
  esCorporativo: boolean,
  r: { cuit?: string | null; nombre?: string | null; numero_documento?: string | null; codigo_asegurado: string },
) {
  if (esCorporativo) {
    const cuit = (r.cuit ?? "").trim();
    const razonSocial = (r.nombre ?? "").trim() || cuit;
    if (!cuit) return;
    await prisma.clientes_corporativos.upsert({
      where: { cliente_id: clienteId },
      create: { cliente_id: clienteId, cuit, razon_social: razonSocial },
      update: { cuit, razon_social: razonSocial },
    });
  } else {
    const dni = (r.numero_documento ?? r.codigo_asegurado).trim();
    const nombre = (r.nombre ?? "").trim() || "Sin nombre";
    if (!dni) return;
    await prisma.clientes_no_corporativos.upsert({
      where: { cliente_id: clienteId },
      create: { cliente_id: clienteId, dni, nombre, apellido: "" },
      update: { dni, nombre },
    });
  }
}

async function vincularExistente(
  codigo: string,
  esCorporativo: boolean,
  r: { cuit?: string | null; numero_documento?: string | null; raw?: Prisma.InputJsonValue | null },
): Promise<boolean> {
  let clienteId: number | null = null;

  if (esCorporativo && r.cuit) {
    const corp = await prisma.clientes_corporativos.findUnique({
      where: { cuit: r.cuit },
      select: { cliente_id: true },
    });
    if (corp) clienteId = corp.cliente_id;
  } else if (!esCorporativo && r.numero_documento) {
    const nocorp = await prisma.clientes_no_corporativos.findUnique({
      where: { dni: r.numero_documento },
      select: { cliente_id: true },
    });
    if (nocorp) clienteId = nocorp.cliente_id;
  }

  if (!clienteId) return false;

  await prisma.clientes.update({
    where: { id: clienteId },
    data: {
      codigo_asegurado_berkley: codigo,
      raw_berkley: r.raw ?? Prisma.JsonNull,
    },
  });
  return true;
}

// ---------------------------------------------------------------------------
// Pólizas
// ---------------------------------------------------------------------------

async function migratePolizas() {
  const rows = await prisma.berkley_cartera_polizas.findMany();
  console.log(`\n[polizas] Registros en cartera: ${rows.length}`);

  const aseguradora = await prisma.empresas_aseguradoras.findFirst({
    where: { codigo_integracion: "berkley" },
    select: { id: true },
  });
  if (!aseguradora) {
    console.error("  ✗ No se encontró aseguradora con codigo_integracion='berkley'. Salteando pólizas.");
    return;
  }

  let creadas = 0;
  let actualizadas = 0;
  let omitidas = 0;

  for (const r of rows) {
    const numeroPoliza = `${r.rama}-${r.poliza}-${r.suplemento}`;
    const estado: "vigente" | "anulada" = r.anulada ? "anulada" : "vigente";

    const existing = await prisma.polizas.findUnique({
      where: { numero_poliza: numeroPoliza },
      select: { id: true },
    });

    // Buscar cliente por codigo_asegurado_berkley.
    let clienteId: number | null = null;
    if (r.codigo_asegurado) {
      const cli = await prisma.clientes.findUnique({
        where: { codigo_asegurado_berkley: r.codigo_asegurado },
        select: { id: true },
      });
      clienteId = cli?.id ?? null;
    }

    const polizaData = {
      rama: r.rama,
      suplemento: r.suplemento,
      raw_berkley: r.raw as Prisma.InputJsonValue,
      estado,
      fecha_inicio_vigencia: r.vigencia_inicio ?? undefined,
      fecha_fin_vigencia: r.vigencia_fin ?? undefined,
    };

    if (!existing) {
      if (!clienteId) {
        console.warn(`  ✗ póliza ${numeroPoliza} sin cliente match (codigo_asegurado=${r.codigo_asegurado})`);
        omitidas++;
        continue;
      }
      await prisma.polizas.create({
        data: {
          numero_poliza: numeroPoliza,
          cliente_id: clienteId,
          aseguradora_id: aseguradora.id,
          ...polizaData,
        },
      });
      console.log(`  ✓ póliza ${numeroPoliza} creada`);
      creadas++;
    } else {
      await prisma.polizas.update({
        where: { id: existing.id },
        data: polizaData,
      });
      actualizadas++;
    }
  }

  console.log(`  → creadas: ${creadas}, actualizadas: ${actualizadas}, omitidas: ${omitidas}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Migración Berkley cartera → tablas de dominio ===");
  await migrateClientes();
  await migratePolizas();
  console.log("\n=== Completado ===");
  console.log("Próximo paso: verificar conteos, luego eliminar los modelos berkley_cartera_* del schema.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
