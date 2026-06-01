import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { aseguradoraColor } from "@/lib/domain/aseguradora-color";
import type { AseguradoraListItem } from "./types";

const ACTIVE_ESTADOS = ["vigente", "proxima"] as const;
const COMPUTABLE_ESTADOS = ["vigente", "proxima", "renovada"] as const;

function aseguradoraInitials(razonSocial: string): string {
  return (
    razonSocial
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || razonSocial.slice(0, 2).toUpperCase()
  );
}

export async function getAseguradoras(): Promise<AseguradoraListItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.aseguradoras, CACHE_TAGS.polizas);

  const [aseguradoras, totalCarteraActiva] = await Promise.all([
    prisma.empresas_aseguradoras.findMany({
      orderBy: { razon_social: "asc" },
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
      .filter((p) =>
        (COMPUTABLE_ESTADOS as readonly string[]).includes(p.estado),
      )
      .reduce((s, p) => s + Number(p.prima_mensual), 0);
    return {
      id: a.id,
      razonSocial: a.razon_social,
      cuit: a.cuit,
      email: a.email,
      telefono: a.telefono,
      color: aseguradoraColor(a.id),
      initials: aseguradoraInitials(a.razon_social),
      polizasActivas: activas.length,
      primaMensual,
      pctCartera: (activas.length / denom) * 100,
    };
  });
}

export async function getAseguradoraById(
  id: number,
): Promise<AseguradoraListItem | null> {
  const all = await getAseguradoras();
  return all.find((a) => a.id === id) ?? null;
}
