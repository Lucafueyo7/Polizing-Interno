import { prisma } from "@/lib/prisma";
import { TODAY_ISO } from "@/lib/format/date";
import type { DashboardKPIs, SidebarBadges } from "./types";

const ACTIVE_POLIZAS = ["vigente", "proxima"] as const;
const PENDING_SINIESTROS = ["nuevo", "tramite"] as const;

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
