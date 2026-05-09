import { prisma } from "@/lib/prisma";
import {
  aseguradoraRefFromRow,
  clienteRefFromRow,
  isoDate,
  toPolizaEstado,
  vencimientoDays,
} from "./_mappers";
import type { PolizaFull, PolizaListItem } from "./types";

const POLIZA_INCLUDE = {
  poliza_cliente: {
    include: {
      clientes: {
        include: {
          clientes_corporativos: true,
          clientes_no_corporativos: true,
        },
      },
    },
  },
  poliza_empresa: {
    include: { empresas_aseguradoras: true },
  },
  tipo_poliza: true,
} as const;

type PolizaRow = Awaited<ReturnType<typeof findPolizas>>[number];

function findPolizas() {
  return prisma.polizas.findMany({
    orderBy: { id: "asc" },
    include: POLIZA_INCLUDE,
  });
}

function toListItem(row: PolizaRow): PolizaListItem | null {
  const cliente = row.poliza_cliente?.clientes;
  const aseguradora = row.poliza_empresa?.empresas_aseguradoras;
  if (!cliente || !aseguradora) return null;
  return {
    id: row.id,
    numero: row.numero_poliza,
    tipo: row.tipo_poliza?.tipo_seguro_id ?? null,
    cobertura: row.cobertura,
    inicio: isoDate(row.fecha_inicio_vigencia),
    fin: isoDate(row.fecha_fin_vigencia),
    suma: Number(row.suma_asegurada ?? 0),
    prima: Number(row.prima_mensual ?? 0),
    estado: toPolizaEstado(row.estado),
    diasHastaVencimiento: vencimientoDays(row.fecha_fin_vigencia),
    cliente: clienteRefFromRow(cliente),
    aseguradora: aseguradoraRefFromRow(aseguradora),
  };
}

export async function getPolizas(): Promise<PolizaListItem[]> {
  const rows = await findPolizas();
  return rows
    .map(toListItem)
    .filter((p): p is PolizaListItem => p !== null);
}

export async function getPolizaById(id: number): Promise<PolizaFull | null> {
  const row = await prisma.polizas.findUnique({
    where: { id },
    include: POLIZA_INCLUDE,
  });
  if (!row) return null;
  const base = toListItem(row);
  if (!base) return null;
  return {
    ...base,
    emision: isoDate(row.fecha_emision),
  };
}
