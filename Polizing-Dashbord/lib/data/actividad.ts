import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { cacheLife, cacheTag } from "next/cache";
export type ActivityType = "siniestro" | "poliza" | "pago";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  meta: string;
  when: string;
  timestamp: number;
};

function timeAgo(date: Date | null | undefined): string {
  if (!date) return "hoy";
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  if (diffHours < 1) return "hace unos minutos";
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? "ayer" : `hace ${diffDays} d`;
}

function labelFromCliente(cliente: {
  clientes_corporativos: { razon_social: string } | null;
  clientes_no_corporativos: { nombre: string; apellido: string } | null;
}): string {
  if (cliente.clientes_corporativos) return cliente.clientes_corporativos.razon_social;
  if (cliente.clientes_no_corporativos)
    return `${cliente.clientes_no_corporativos.nombre} ${cliente.clientes_no_corporativos.apellido}`;
  return "Cliente";
}

export async function getActividadReciente(limit = 10): Promise<ActivityItem[]> {
  "use cache";
  cacheLife("medium");
  cacheTag(CACHE_TAGS.actividad);
  const [siniestros, polizas, pagos] = await Promise.all([
    prisma.siniestros.findMany({
      orderBy: { fecha_reporte: "desc" },
      take: limit,
      include: {
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
    }),
    prisma.polizas.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        cliente: {
          include: {
            clientes_corporativos: true,
            clientes_no_corporativos: true,
          },
        },
      },
    }),
    prisma.pagos.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        cliente: {
          include: {
            clientes_corporativos: true,
            clientes_no_corporativos: true,
          },
        },
      },
    }),
  ]);

  const items: ActivityItem[] = [
    ...siniestros.map((row) => ({
      id: `s-${row.id}`,
      type: "siniestro" as const,
      title: row.titulo,
      meta: `${labelFromCliente(row.poliza.cliente)} · Siniestro`,
      when: timeAgo(row.fecha_reporte),
      timestamp: row.fecha_reporte?.getTime() ?? 0,
    })),
    ...polizas.map((row) => ({
      id: `p-${row.id}`,
      type: "poliza" as const,
      title: `Póliza ${row.numero_poliza}`,
      meta: `${labelFromCliente(row.cliente)} · ${row.estado}`,
      when: timeAgo(row.created_at),
      timestamp: row.created_at?.getTime() ?? 0,
    })),
    ...pagos.map((row) => ({
      id: `g-${row.id}`,
      type: "pago" as const,
      title: `Pago ${row.numero_recibo ?? row.id}`,
      meta: `${labelFromCliente(row.cliente)} · ${Number(row.importe ?? 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}`,
      when: timeAgo(row.created_at),
      timestamp: row.created_at?.getTime() ?? 0,
    })),
  ];

  return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}
