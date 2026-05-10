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
    const tipoSeguroIdMap = await seedTiposSeguro(prisma);
    const clienteIdMap = await seedClientes(prisma);
    const aseguradoraIdMap = await seedAseguradoras(prisma);
    const pagoIdMap = await seedPagos(prisma, clienteIdMap);
    const polizaIdMap = await seedPolizas(
      prisma,
      clienteIdMap,
      aseguradoraIdMap,
      tipoSeguroIdMap,
      pagoIdMap,
    );
    await seedSiniestros(prisma, polizaIdMap);

    const counts = await tally(prisma);
    console.log("✅ Seed completo:", counts);
  } finally {
    await pool.end();
  }
}

async function reset(prisma: PrismaClient) {
  await prisma.siniestro_documentos.deleteMany();
  await prisma.siniestros.deleteMany();
  await prisma.polizas.deleteMany();
  await prisma.pagos.deleteMany();
  await prisma.clientes_corporativos.deleteMany();
  await prisma.clientes_no_corporativos.deleteMany();
  await prisma.clientes.deleteMany();
  await prisma.empresas_aseguradoras.deleteMany();
  await prisma.tipos_seguro.deleteMany();
}

async function seedTiposSeguro(prisma: PrismaClient): Promise<Map<string, number>> {
  const nombres = Array.from(new Set(POLIZAS.map((p) => p.tipo)));
  const map = new Map<string, number>();
  for (const nombre of nombres) {
    const created = await prisma.tipos_seguro.create({ data: { nombre } });
    map.set(nombre, created.id);
  }
  return map;
}

async function seedClientes(prisma: PrismaClient): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const c of CLIENTES) {
    const created = await prisma.clientes.create({
      data: {
        tipo: c.tipo === "corp" ? "corporativo" : "persona",
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
        contacto_nombre: a.contactoNombre,
        direccion: a.direccion,
      },
    });
    map.set(a.id, created.id);
  }
  return map;
}

async function seedPagos(
  prisma: PrismaClient,
  clienteIdMap: Map<string, number>,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const pago of PAGOS) {
    const clienteId = required(clienteIdMap, pago.clienteId, `cliente ${pago.clienteId}`);
    const created = await prisma.pagos.create({
      data: {
        cliente_id: clienteId,
        monto: pago.monto,
        fecha_pago: pago.fechaPago ? new Date(pago.fechaPago) : null,
        estado: pago.estado,
        metodo_pago: pago.metodoPago,
        comprobante: pago.comprobante,
        cbu: pago.cbu,
      },
    });
    map.set(pago.id, created.id);
  }
  return map;
}

async function seedPolizas(
  prisma: PrismaClient,
  clienteIdMap: Map<string, number>,
  aseguradoraIdMap: Map<string, number>,
  tipoSeguroIdMap: Map<string, number>,
  pagoIdMap: Map<string, number>,
): Promise<Map<string, number>> {
  const polizaToPago = new Map<string, number>();
  for (const pago of PAGOS) {
    const pagoId = required(pagoIdMap, pago.id, `pago ${pago.id}`);
    for (const polizaId of pago.polizaIds) {
      polizaToPago.set(polizaId, pagoId);
    }
  }

  const map = new Map<string, number>();
  for (const p of POLIZAS) {
    const clienteId = required(clienteIdMap, p.clienteId, `cliente ${p.clienteId}`);
    const aseguradoraId = required(aseguradoraIdMap, p.aseguradoraId, `aseguradora ${p.aseguradoraId}`);
    const tipoSeguroId = required(tipoSeguroIdMap, p.tipo, `tipo ${p.tipo}`);
    const pagoId = polizaToPago.get(p.id) ?? null;

    const created = await prisma.polizas.create({
      data: {
        numero_poliza: p.numero,
        cliente_id: clienteId,
        aseguradora_id: aseguradoraId,
        tipo_seguro_id: tipoSeguroId,
        cobertura: p.cobertura,
        estado: p.estado,
        fecha_emision: new Date(p.emision),
        fecha_inicio_vigencia: new Date(p.inicio),
        fecha_fin_vigencia: new Date(p.fin),
        suma_asegurada: p.suma,
        prima_mensual: p.prima,
        pago_id: pagoId,
      },
    });
    map.set(p.id, created.id);
  }
  return map;
}

async function seedSiniestros(
  prisma: PrismaClient,
  polizaIdMap: Map<string, number>,
) {
  for (const s of SINIESTROS) {
    const polizaId = required(polizaIdMap, s.polizaId, `póliza ${s.polizaId}`);
    const created = await prisma.siniestros.create({
      data: {
        poliza_id: polizaId,
        numero: s.numero,
        titulo: s.titulo,
        fecha_ocurrencia: new Date(s.fecha),
        fecha_reporte: new Date(s.fechaReporte),
        descripcion_hechos: s.descripcion,
        estado: s.estado,
        leido: s.leido,
        ai_summary: s.aiSummary,
      },
    });
    if (s.docs.length > 0) {
      await prisma.siniestro_documentos.createMany({
        data: s.docs.map((d) => ({
          siniestro_id: created.id,
          tipo: d.tipo,
          nombre: d.nombre,
          url: `/docs/siniestros/${created.id}/${d.nombre}`,
          mime_type: d.tipo === "img" ? "image/jpeg" : "application/pdf",
        })),
      });
    }
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
