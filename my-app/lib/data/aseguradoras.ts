import { prisma } from "@/lib/prisma";
import type { AseguradoraListItem } from "./types";

const ACTIVE_ESTADOS = ["vigente", "proxima"] as const;

export async function getAseguradoras(): Promise<AseguradoraListItem[]> {
  const [aseguradoras, totalCarteraActiva] = await Promise.all([
    prisma.empresas_aseguradoras.findMany({
      orderBy: { id: "asc" },
      include: {
        poliza_empresa: {
          include: {
            polizas: { select: { estado: true, prima_mensual: true } },
          },
        },
      },
    }),
    prisma.polizas.count({
      where: { estado: { in: [...ACTIVE_ESTADOS] } },
    }),
  ]);

  const denom = totalCarteraActiva || 1;

  return aseguradoras.map((a) => {
    const polizas = a.poliza_empresa
      .map((pe) => pe.polizas)
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    const activas = polizas.filter(
      (p) => p.estado && (ACTIVE_ESTADOS as readonly string[]).includes(p.estado),
    );
    const primaMensual = polizas
      .filter(
        (p) => p.estado && p.estado !== "anulada" && p.estado !== "vencida",
      )
      .reduce((s, p) => s + Number(p.prima_mensual ?? 0), 0);
    return {
      id: a.id,
      razonSocial: a.razon_social ?? "",
      cuit: a.cuit,
      contacto: a.contacto_nombre,
      email: a.email,
      telefono: a.telefono,
      direccion: a.direccion,
      color: a.color_hex ?? "#5b6677",
      polizasActivas: activas.length,
      primaMensual,
      pctCartera: (activas.length / denom) * 100,
    };
  });
}
