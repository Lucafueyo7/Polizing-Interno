import { prisma } from "@/lib/prisma";
import {
  aseguradoraRefFromRow,
  clienteRefFromRow,
  isoDate,
  vencimientoDays,
} from "./_mappers";
import type { PolizaFull, PolizaListItem } from "./types";

const POLIZA_INCLUDE = {
  cliente: {
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
    },
  },
  aseguradora: true,
  tipo_seguro: true,
} as const;

type PolizaRow = Awaited<ReturnType<typeof findPolizas>>[number];

function findPolizas() {
  return prisma.polizas.findMany({
    orderBy: { id: "asc" },
    include: POLIZA_INCLUDE,
  });
}

function toListItem(row: PolizaRow): PolizaListItem {
  return {
    id: row.id,
    numero: row.numero_poliza,
    tipo: row.tipo_seguro.nombre,
    cobertura: row.cobertura,
    inicio: isoDate(row.fecha_inicio_vigencia),
    fin: isoDate(row.fecha_fin_vigencia),
    suma: Number(row.suma_asegurada),
    prima: Number(row.prima_mensual),
    estado: row.estado,
    diasHastaVencimiento: vencimientoDays(row.fecha_fin_vigencia),
    cliente: clienteRefFromRow(row.cliente),
    aseguradora: aseguradoraRefFromRow(row.aseguradora),
  };
}

export async function getPolizas(): Promise<PolizaListItem[]> {
  const rows = await findPolizas();
  return rows.map(toListItem);
}

export async function getPolizaById(id: number): Promise<PolizaFull | null> {
  const row = await prisma.polizas.findUnique({
    where: { id },
    include: POLIZA_INCLUDE,
  });
  if (!row) return null;
  return {
    ...toListItem(row),
    emision: isoDate(row.fecha_emision),
  };
}
