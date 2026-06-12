import { createCachedGetter, CACHE_TAGS } from "./cache";
import { prisma } from "@/lib/prisma";
import { aseguradoraColor } from "@/lib/domain/aseguradora-color";
import { clienteRefFromRow, isoDateTime } from "./_mappers";
import type {
  DashboardKPIs,
  DistribucionAseguradora,
  SidebarBadges,
  SiniestroPendiente,
} from "./types";

const ACTIVE_POLIZAS = ["vigente"] as const;
const PENDING_SINIESTROS = ["nuevo", "en_tramite"] as const;
const COMPUTABLE_POLIZAS = ["vigente"] as const;

const getDashboardKPIsCached = createCachedGetter(
  getDashboardKPIsImpl,
  ["kpis", "dashboard"],
  CACHE_TAGS.kpis,
);

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  return getDashboardKPIsCached();
}

async function getDashboardKPIsImpl(): Promise<DashboardKPIs> {
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

const getSidebarBadgesCached = createCachedGetter(
  getSidebarBadgesImpl,
  ["kpis", "sidebar-badges"],
  CACHE_TAGS.kpis,
);

export async function getSidebarBadges(): Promise<SidebarBadges> {
  return getSidebarBadgesCached();
}

async function getSidebarBadgesImpl(): Promise<SidebarBadges> {
  const siniestrosNuevos = await prisma.siniestros.count({ where: { estado: "nuevo" } });
  return { siniestrosNuevos };
}

const getSiniestrosPendientesCached = createCachedGetter(
  getSiniestrosPendientesImpl,
  ["kpis", "siniestros-pendientes"],
  CACHE_TAGS.kpis,
);

export async function getSiniestrosPendientes(
  limit = 5,
): Promise<SiniestroPendiente[]> {
  return getSiniestrosPendientesCached(limit);
}

async function getSiniestrosPendientesImpl(
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

const getDistribucionAseguradorasCached = createCachedGetter(
  getDistribucionAseguradorasImpl,
  ["kpis", "distribucion"],
  CACHE_TAGS.kpis,
);

export async function getDistribucionAseguradoras(): Promise<
  DistribucionAseguradora[]
> {
  return getDistribucionAseguradorasCached();
}

async function getDistribucionAseguradorasImpl(): Promise<
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
