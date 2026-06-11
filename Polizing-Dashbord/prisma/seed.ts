import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { normalizePgUrl } from "../lib/utils/db-url";
import { normalizeTelefono } from "../lib/format/telefono";
import {
  ASEGURADORAS,
  CLIENTES,
  COBERTURAS_GENERICAS,
  PAGOS,
  POLIZAS,
  RAMAS_GENERICAS,
  SINIESTROS,
  TIPOS_SEGURO,
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
    await seedRamasGenericas(prisma);
    await seedCoberturasGenericas(prisma);
    const { tipoSeguroIdMap, coberturaIdMap } = await seedTiposSeguro(prisma);
    const clienteIdMap = await seedClientes(prisma);
    const aseguradoraIdMap = await seedAseguradoras(prisma);
    const pagoIdMap = await seedPagos(prisma, clienteIdMap);
    await seedPolizas(
      prisma,
      clienteIdMap,
      aseguradoraIdMap,
      tipoSeguroIdMap,
      coberturaIdMap,
      pagoIdMap,
    );
    await seedSiniestros(prisma);

    const counts = await tally(prisma);
    console.log("✅ Seed completo:", counts);
  } finally {
    await pool.end();
  }
}

async function reset(prisma: PrismaClient) {
  await prisma.siniestro_lecturas.deleteMany();
  await prisma.siniestro_documentos.deleteMany();
  await prisma.siniestros.deleteMany();
  await prisma.polizas.deleteMany();
  await prisma.coberturas.deleteMany();
  await prisma.coberturas_genericas.deleteMany();
  await prisma.pagos.deleteMany();
  await prisma.clientes_corporativos.deleteMany();
  await prisma.clientes_no_corporativos.deleteMany();
  await prisma.clientes.deleteMany();
  await prisma.empresas_aseguradoras.deleteMany();
  await prisma.tipos_seguro.deleteMany();
  await prisma.ramas_genericas.deleteMany();
}

async function seedRamasGenericas(prisma: PrismaClient) {
  for (const r of RAMAS_GENERICAS) {
    await prisma.ramas_genericas.create({
      data: { codigo: r.codigo, nombre: r.nombre },
    });
  }
}

async function seedCoberturasGenericas(prisma: PrismaClient) {
  for (const c of COBERTURAS_GENERICAS) {
    await prisma.coberturas_genericas.create({
      data: { codigo: c.codigo, nombre: c.nombre },
    });
  }
}

async function seedTiposSeguro(prisma: PrismaClient): Promise<{
  tipoSeguroIdMap: Map<string, number>;
  /** Key: `${tipoNombre}|${coberturaNombre}` → cobertura.id */
  coberturaIdMap: Map<string, number>;
}> {
  const tipoSeguroIdMap = new Map<string, number>();
  const coberturaIdMap = new Map<string, number>();
  for (const t of TIPOS_SEGURO) {
    const created = await prisma.tipos_seguro.create({
      data: {
        nombre: t.nombre,
        categoria: t.categoria,
        descripcion: t.descripcion ?? null,
        ...(t.rama ? { rama: { connect: { codigo: t.rama } } } : {}),
      },
    });
    tipoSeguroIdMap.set(t.nombre, created.id);
    for (const cob of t.coberturas) {
      const c = await prisma.coberturas.create({
        data: {
          tipo_seguro: { connect: { id: created.id } },
          nombre: cob.nombre,
          descripcion: cob.descripcion ?? null,
          cobertura_generica: { connect: { codigo: cob.nombre } },
        },
      });
      coberturaIdMap.set(`${t.nombre}|${cob.nombre}`, c.id);
    }
  }
  return { tipoSeguroIdMap, coberturaIdMap };
}

async function seedClientes(prisma: PrismaClient): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const c of CLIENTES) {
    const created = await prisma.clientes.create({
      data: {
        tipo: c.tipo === "corp" ? "corporativo" : "persona",
        email: c.email,
        telefono: normalizeTelefono(c.telefono),
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
        telefono: normalizeTelefono(a.telefono),
        email: a.email,
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
  coberturaIdMap: Map<string, number>,
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
    const coberturaId = required(
      coberturaIdMap,
      `${p.tipo}|${p.cobertura}`,
      `cobertura ${p.cobertura} para tipo ${p.tipo}`,
    );
    const pagoId = polizaToPago.get(p.id) ?? null;

    const created = await prisma.polizas.create({
      data: {
        numero_poliza: p.numero,
        cliente_id: clienteId,
        aseguradora_id: aseguradoraId,
        tipo_seguro_id: tipoSeguroId,
        cobertura_id: coberturaId,
        estado: p.estado,
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

async function seedSiniestros(prisma: PrismaClient) {
  for (const s of SINIESTROS) {
    const poliza = await prisma.polizas.findUnique({
      where: { numero_poliza: numeroPolizaFromSeedId(s.polizaId) },
    });
    if (!poliza) throw new Error(`Seed: póliza ${s.polizaId} no encontrada`);
    const created = await prisma.siniestros.create({
      data: {
        poliza_id: poliza.id,
        numero: s.numero,
        titulo: s.titulo,
        fecha_ocurrencia: new Date(s.fecha),
        fecha_reporte: new Date(s.fechaReporte),
        estado: s.estado,
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

/** Mapea el id de seed (`P-YYYY-NNNN`) al numero_poliza correspondiente. */
function numeroPolizaFromSeedId(seedId: string): string {
  const poliza = POLIZAS.find((p) => p.id === seedId);
  if (!poliza) throw new Error(`Seed: póliza ${seedId} no definida en POLIZAS`);
  return poliza.numero;
}

async function tally(prisma: PrismaClient) {
  const [clientes, aseguradoras, tiposSeguro, coberturas, polizas, siniestros, pagos] =
    await Promise.all([
      prisma.clientes.count(),
      prisma.empresas_aseguradoras.count(),
      prisma.tipos_seguro.count(),
      prisma.coberturas.count(),
      prisma.polizas.count(),
      prisma.siniestros.count(),
      prisma.pagos.count(),
    ]);
  return { clientes, aseguradoras, tiposSeguro, coberturas, polizas, siniestros, pagos };
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
