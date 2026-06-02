import { prisma } from "@/lib/prisma";
import { TODAY_ISO } from "@/lib/format/date";
import { aseguradoraColor } from "@/lib/domain/aseguradora-color";
import { clienteRefFromRow, isoDateTime } from "./_mappers";
import type {
  DashboardKPIs,
  DistribucionAseguradora,
  SidebarBadges,
  SiniestroPendiente,
} from "./types";

const ACTIVE_POLIZAS = ["vigente", "proxima"] as const;
const PENDING_SINIESTROS = ["nuevo", "pendiente_documentacion", "en_tramite"] as const;
const COMPUTABLE_POLIZAS = ["vigente", "proxima", "renovada"] as const;

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const [clientesActivos, polizasVigentes, siniestrosTramite, primaAgg] =
    await Promise.all([
      prisma.clientes.count({ where: { estado: "activo" } }),
      prisma.polizas.count({ where: { estado: { in: [...ACTIVE_POLIZAS] } } }),
      prisma.siniestros.count({
        where: { estado: { in: [...PENDING_SINIESTROS] } },
      }),
      prisma.polizas.aggregate({
        where: { estado: { in: [...ACTIVE_POLIZAS] } },
        _sum: { prima_mensual: true },
      }),
    ]);

  return {
    clientesActivos,
    polizasVigentes,
    siniestrosTramite,
    primaMensual: Number(primaAgg._sum.prima_mensual ?? 0),
  };
}

export async function getSidebarBadges(): Promise<SidebarBadges> {
  const today = new Date(TODAY_ISO);
  const limit = new Date(TODAY_ISO);
  limit.setDate(limit.getDate() + 30);

  const [siniestrosNuevos, polizasPorVencer] = await Promise.all([
    prisma.siniestros.count({ where: { estado: "nuevo" } }),
    prisma.polizas.count({
      where: {
        estado: { in: [...ACTIVE_POLIZAS] },
        fecha_fin_vigencia: { gte: today, lte: limit },
      },
    }),
  ]);
  return { siniestrosNuevos, polizasPorVencer };
}

export async function getSiniestrosPendientes(
  limit = 5,
): Promise<SiniestroPendiente[]> {
  const rows = await prisma.siniestros.findMany({
    where: { estado: "nuevo" },
    orderBy: { fecha_reporte: "desc" },
    take: limit,
    include: {
      documentos: { select: { id: true } },
      poliza: {
        include: {
          cliente: {
            include: {
              clientes_corporativos: true,
              clientes_no_corporativos: true,
            },
          },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    titulo: row.titulo,
    cliente: clienteRefFromRow(row.poliza.cliente),
    fechaReporte: isoDateTime(row.fecha_reporte),
    docsCount: row.documentos.length,
  }));
}

export async function getDistribucionAseguradoras(): Promise<
  DistribucionAseguradora[]
> {
  const aseguradoras = await prisma.empresas_aseguradoras.findMany({
    orderBy: { id: "asc" },
    include: {
      polizas: { select: { estado: true } },
    },
  });

  const totalActivas = aseguradoras.reduce(
    (sum, a) =>
      sum +
      a.polizas.filter((p) =>
        (COMPUTABLE_POLIZAS as readonly string[]).includes(p.estado),
      ).length,
    0,
  );
  const denom = totalActivas || 1;

  return aseguradoras.map((a) => {
    const polizasActivas = a.polizas.filter((p) =>
      (COMPUTABLE_POLIZAS as readonly string[]).includes(p.estado),
    ).length;
    return {
      id: a.id,
      razonSocial: a.razon_social,
      color: aseguradoraColor(a.id),
      polizasActivas,
      pct: (polizasActivas / denom) * 100,
    };
  });
}
