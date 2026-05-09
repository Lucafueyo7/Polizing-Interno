import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { normalizePgUrl } from "../lib/utils/db-url";
import {
  ASEGURADORAS,
  CLIENTES,
  PAGOS,
  POLIZAS,
  SINIESTROS,
} from "./seed-data";

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DIRECT_URL/DATABASE_URL in environment");
  }
  const pool = new Pool({ connectionString: normalizePgUrl(url) });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await reset(prisma);
    await seedCatalogos(prisma);
    const clienteIdMap = await seedClientes(prisma);
    const aseguradoraIdMap = await seedAseguradoras(prisma);
    const polizaIdMap = await seedPolizas(prisma, clienteIdMap, aseguradoraIdMap);
    await seedSiniestros(prisma, polizaIdMap);
    await seedPagos(prisma, clienteIdMap, polizaIdMap);

    const counts = await tally(prisma);
    console.log("✅ Seed completo:", counts);
  } finally {
    await pool.end();
  }
}

async function reset(prisma: PrismaClient) {
  // Cascading deletes desde las raíces. El orden importa para FKs.
  await prisma.pagos_polizas.deleteMany();
  await prisma.pagos.deleteMany();
  await prisma.siniestro_documentos.deleteMany();
  await prisma.siniestros_poliza.deleteMany();
  await prisma.siniestros.deleteMany();
  await prisma.cobertura_poliza.deleteMany();
  await prisma.tipo_poliza.deleteMany();
  await prisma.poliza_cliente.deleteMany();
  await prisma.poliza_empresa.deleteMany();
  await prisma.polizas.deleteMany();
  await prisma.clientes_corporativos.deleteMany();
  await prisma.clientes_no_corporativos.deleteMany();
  await prisma.clientes.deleteMany();
  await prisma.empresas_aseguradoras.deleteMany();
  await prisma.coberturas.deleteMany();
  await prisma.tipos_seguro.deleteMany();
}

async function seedCatalogos(prisma: PrismaClient) {
  const tipos = Array.from(new Set(POLIZAS.map((p) => p.tipo)));
  await prisma.tipos_seguro.createMany({
    data: tipos.map((nombre) => ({ nombre })),
    skipDuplicates: true,
  });
  await prisma.roles.createMany({
    data: [{ rol: "Productor" }, { rol: "Administrativo" }],
    skipDuplicates: true,
  });
}

async function seedClientes(prisma: PrismaClient): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const c of CLIENTES) {
    const created = await prisma.clientes.create({
      data: {
        email: c.email,
        telefono: c.telefono,
        direccion: c.direccion,
        fecha_alta: new Date(c.desde),
        estado: c.estado,
      },
    });
    map.set(c.id, created.id);
    if (c.tipo === "corp") {
      await prisma.clientes_corporativos.create({
        data: {
          cliente_id: created.id,
          cuit: c.cuit,
          razon_social: c.razonSocial,
          contacto_nombre: c.contactoNombre,
        },
      });
    } else {
      await prisma.clientes_no_corporativos.create({
        data: {
          cliente_id: created.id,
          dni: c.dni,
          nombre: c.nombre,
          apellido: c.apellido,
        },
      });
    }
  }
  return map;
}

async function seedAseguradoras(prisma: PrismaClient): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const a of ASEGURADORAS) {
    const created = await prisma.empresas_aseguradoras.create({
      data: {
        razon_social: a.razonSocial,
        cuit: a.cuit,
        telefono: a.telefono,
        email: a.email,
        direccion: a.direccion,
        contacto_nombre: a.contacto,
        color_hex: a.color,
      },
    });
    map.set(a.id, created.id);
  }
  return map;
}

async function seedPolizas(
  prisma: PrismaClient,
  clienteIdMap: Map<string, number>,
  aseguradoraIdMap: Map<string, number>,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const p of POLIZAS) {
    const created = await prisma.polizas.create({
      data: {
        numero_poliza: p.numero,
        fecha_emision: new Date(p.emision),
        fecha_inicio_vigencia: new Date(p.inicio),
        fecha_fin_vigencia: new Date(p.fin),
        estado: p.estado,
        suma_asegurada: p.suma,
        prima_mensual: p.prima,
        cobertura: p.cobertura,
      },
    });
    map.set(p.id, created.id);

    const clienteId = required(clienteIdMap, p.clienteId, `cliente ${p.clienteId}`);
    const aseguradoraId = required(aseguradoraIdMap, p.aseguradoraId, `aseguradora ${p.aseguradoraId}`);

    await prisma.poliza_cliente.create({
      data: { poliza_id: created.id, cliente_id: clienteId },
    });
    await prisma.poliza_empresa.create({
      data: { id_poliza: created.id, aseguradora_id: aseguradoraId },
    });
    await prisma.tipo_poliza.create({
      data: { id_poliza: created.id, tipo_seguro_id: p.tipo },
    });
  }
  return map;
}

async function seedSiniestros(
  prisma: PrismaClient,
  polizaIdMap: Map<string, number>,
) {
  for (const s of SINIESTROS) {
    const created = await prisma.siniestros.create({
      data: {
        numero: s.numero,
        titulo: s.titulo,
        fecha_ocurrencia: new Date(s.fecha),
        fecha_reporte: new Date(s.fechaReporte),
        descripcion_hechos: s.descripcion,
        estado: s.estado,
        fuente: s.fuente,
        leido: s.leido,
        ai_summary: s.aiSummary,
      },
    });
    const polizaId = required(polizaIdMap, s.polizaId, `póliza ${s.polizaId}`);
    await prisma.siniestros_poliza.create({
      data: { id_poliza: polizaId, id_siniestro: created.id },
    });
    if (s.docs.length > 0) {
      await prisma.siniestro_documentos.createMany({
        data: s.docs.map((d) => ({
          siniestro_id: created.id,
          tipo: d.tipo,
          nombre: d.nombre,
          tamano: d.tamano,
          procesado_ia: d.ai,
        })),
      });
    }
  }
}

async function seedPagos(
  prisma: PrismaClient,
  clienteIdMap: Map<string, number>,
  polizaIdMap: Map<string, number>,
) {
  for (const pago of PAGOS) {
    const total = pago.items.reduce((s, i) => s + i.monto, 0);
    const clienteId = required(clienteIdMap, pago.clienteId, `cliente ${pago.clienteId}`);
    const created = await prisma.pagos.create({
      data: {
        cliente_id: clienteId,
        fecha_emision: new Date(pago.fechaEmision),
        fecha_pago: pago.estado === "validado" ? new Date(pago.fechaEmision) : null,
        periodo: pago.periodo,
        estado: pago.estado,
        metodo_pago: pago.metodoPago,
        comprobante: pago.comprobante,
        cbu: pago.cbu,
        monto_total: total,
      },
    });
    await prisma.pagos_polizas.createMany({
      data: pago.items.map((item) => ({
        id_pago: created.id,
        id_poliza: required(polizaIdMap, item.polizaId, `póliza ${item.polizaId}`),
        concepto: item.concepto,
        monto: item.monto,
      })),
    });
  }
}

async function tally(prisma: PrismaClient) {
  const [clientes, aseguradoras, polizas, siniestros, pagos] = await Promise.all([
    prisma.clientes.count(),
    prisma.empresas_aseguradoras.count(),
    prisma.polizas.count(),
    prisma.siniestros.count(),
    prisma.pagos.count(),
  ]);
  return { clientes, aseguradoras, polizas, siniestros, pagos };
}

function required<K, V>(map: Map<K, V>, key: K, label: string): V {
  const value = map.get(key);
  if (value === undefined) throw new Error(`Seed: ${label} no resuelto`);
  return value;
}

main().catch((err) => {
  console.error("❌ Seed falló:", err);
  process.exit(1);
});
