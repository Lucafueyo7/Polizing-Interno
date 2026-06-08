/**
 * Script de prueba: pide la tarjeta de circulación para FELDER DAVID.
 * Uso: npx tsx scripts/test-tarjeta-felder.ts
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { normalizePgUrl } from "../lib/utils/db-url";

const API_URL = "https://polizing-interno.vercel.app";
const API_KEY = process.env.CHATBOT_API_KEY ?? "";

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DIRECT_URL/DATABASE_URL");

  const pool = new Pool({ connectionString: normalizePgUrl(url) });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    // 1. Buscar FELDER DAVID por apellido + nombre
    const nc = await prisma.clientes_no_corporativos.findFirst({
      where: {
        OR: [
          {
            apellido: { contains: "FELDER", mode: "insensitive" },
            nombre: { contains: "DAVID", mode: "insensitive" },
          },
          {
            apellido: { contains: "DAVID", mode: "insensitive" },
            nombre: { contains: "FELDER", mode: "insensitive" },
          },
        ],
      },
      include: { cliente: true },
    });

    if (!nc) {
      console.error("❌ No se encontró FELDER DAVID en clientes_no_corporativos");
      return;
    }

    const cliente = nc.cliente;
    console.log(`✅ Cliente encontrado: id=${cliente.id}  teléfono=${cliente.telefono}  estado=${cliente.estado}`);
    console.log(`   Nombre: ${nc.nombre} ${nc.apellido}`);

    if (!cliente.telefono) {
      console.error("❌ El cliente no tiene teléfono cargado");
      return;
    }

    // 2. Listar pólizas vigentes
    const polizas = await prisma.polizas.findMany({
      where: {
        cliente_id: cliente.id,
        estado: { in: ["vigente", "proxima"] },
      },
      select: {
        id: true,
        numero_poliza: true,
        estado: true,
        rama: true,
        suplemento: true,
        aseguradora_id: true,
        tarjeta_circulacion_pdf: true,
      },
      orderBy: { id: "asc" },
    });

    if (polizas.length === 0) {
      console.error("❌ No hay pólizas vigentes/próximas para este cliente");
      return;
    }

    console.log(`\n📋 Pólizas vigentes (${polizas.length}):`);
    for (const p of polizas) {
      const hasPdf = p.tarjeta_circulacion_pdf ? "✅ PDF cacheado" : "⚠️  sin PDF";
      console.log(`   [${p.id}] ${p.numero_poliza}  estado=${p.estado}  rama=${p.rama}  ${hasPdf}`);
    }

    // 3. Pedir tarjeta para cada póliza
    console.log("\n🔄 Solicitando tarjetas al endpoint...\n");
    for (const poliza of polizas) {
      console.log(`→ Póliza ${poliza.numero_poliza} (id=${poliza.id})`);
      const res = await fetch(`${API_URL}/api/chatbot/circulation-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({ phone: cliente.telefono, policy_id: poliza.id }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        console.log(`  ❌ HTTP ${res.status}: ${JSON.stringify(body)}`);
        continue;
      }

      if (body?.mode === "link") {
        console.log(`  ✅ mode=link`);
        console.log(`     source_url: ${body.source_url}`);
        console.log(`     filename:   ${body.filename}`);
      } else if (body?.mode === "document") {
        const b64Preview = (body.content_base64 as string)?.slice(0, 60) ?? "";
        console.log(`  ✅ mode=document (PDF cacheado)`);
        console.log(`     filename:   ${body.filename}`);
        console.log(`     mime:       ${body.mime_type}`);
        console.log(`     base64:     ${b64Preview}...`);
      } else {
        console.log(`  ⚠️  Respuesta inesperada:`, JSON.stringify(body, null, 2));
      }

      console.log();
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
