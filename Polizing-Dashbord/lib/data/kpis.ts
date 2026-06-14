import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
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

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  "use cache";
  cacheLife("medium");
  cacheTag(CACHE_TAGS.kpis);

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

// El único badge cuenta siniestros "nuevo": se etiqueta con los tags `kpis` y
// `siniestros` para invalidación cruzada: mutaciones de siniestros o de KPIs
// lo refrescan al instante.
export async function getSidebarBadges(): Promise<SidebarBadges> {
  "use cache";
  cacheLife("short");
  cacheTag(CACHE_TAGS.kpis, CACHE_TAGS.siniestros);

  const siniestrosNuevos = await prisma.siniestros.count({
    where: { estado: "nuevo" },
  });
  return { siniestrosNuevos };
}

export async function getSiniestrosPendientes(
  limit = 5,
): Promise<SiniestroPendiente[]> {
  "use cache";
  cacheLife("medium");
  cacheTag(CACHE_TAGS.kpis);

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
  "use cache";
  cacheLife("medium");
  cacheTag(CACHE_TAGS.kpis);

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
