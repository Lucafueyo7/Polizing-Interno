import { prisma } from "@/lib/prisma";
import type { AseguradoraListItem } from "./types";

const ACTIVE_ESTADOS = ["vigente", "proxima"] as const;

export async function getAseguradoras(): Promise<AseguradoraListItem[]> {
  const [aseguradoras, totalCarteraActiva] = await Promise.all([
    prisma.empresas_aseguradoras.findMany({
      orderBy: { id: "asc" },
      include: {
        polizas: { select: { estado: true, prima_mensual: true } },
      },
    }),
    prisma.polizas.count({
      where: { estado: { in: [...ACTIVE_ESTADOS] } },
    }),
  ]);

  const denom = totalCarteraActiva || 1;

  return aseguradoras.map((a) => {
    const activas = a.polizas.filter((p) =>
      (ACTIVE_ESTADOS as readonly string[]).includes(p.estado),
    );
    const primaMensual = a.polizas
      .filter((p) => p.estado !== "anulada" && p.estado !== "vencida")
      .reduce((s, p) => s + Number(p.prima_mensual), 0);
    return {
      id: a.id,
      razonSocial: a.razon_social,
      cuit: a.cuit,
      email: a.email,
      telefono: a.telefono,
      polizasActivas: activas.length,
      primaMensual,
      pctCartera: (activas.length / denom) * 100,
    };
  });
}
