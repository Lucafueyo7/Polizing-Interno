import { prisma } from "@/lib/prisma";
import {
  aseguradoraRefFromRow,
  clienteRefFromRow,
  isoDate,
  isoDateTime,
} from "./_mappers";
import type { SiniestroDoc, SiniestroFull, SiniestroListItem } from "./types";

const LIST_INCLUDE = {
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
} as const;

const FULL_INCLUDE = {
  documentos: true,
  poliza: {
    include: {
      cliente: {
        include: {
          clientes_corporativos: true,
          clientes_no_corporativos: true,
        },
      },
      aseguradora: true,
      tipo_seguro: true,
    },
  },
} as const;

type SiniestroListRow = Awaited<ReturnType<typeof findSiniestros>>[number];
type SiniestroFullRow = NonNullable<
  Awaited<ReturnType<typeof findSiniestroById>>
>;

function findSiniestros() {
  return prisma.siniestros.findMany({
    orderBy: { id: "desc" },
    include: LIST_INCLUDE,
  });
}

function findSiniestroById(id: number) {
  return prisma.siniestros.findUnique({
    where: { id },
    include: FULL_INCLUDE,
  });
}

function toListItem(row: SiniestroListRow): SiniestroListItem {
  return {
    id: row.id,
    numero: row.numero,
    titulo: row.titulo,
    descripcion: row.descripcion_hechos,
    cliente: clienteRefFromRow(row.poliza.cliente),
    fechaReporte: isoDateTime(row.fecha_reporte),
    estado: row.estado,
    leido: row.leido,
    docsCount: row.documentos.length,
  };
}

function toDoc(d: { tipo: "img" | "pdf"; nombre: string; url: string }): SiniestroDoc {
  return { tipo: d.tipo, nombre: d.nombre, url: d.url };
}

function toFull(row: SiniestroFullRow): SiniestroFull {
  return {
    id: row.id,
    numero: row.numero,
    titulo: row.titulo,
    descripcion: row.descripcion_hechos,
    cliente: clienteRefFromRow(row.poliza.cliente),
    fechaReporte: isoDateTime(row.fecha_reporte),
    estado: row.estado,
    leido: row.leido,
    docsCount: row.documentos.length,
    fechaOcurrencia: isoDate(row.fecha_ocurrencia),
    aiSummary: row.ai_summary,
    docs: row.documentos.map(toDoc),
    poliza: {
      id: row.poliza.id,
      numero: row.poliza.numero_poliza,
      tipo: row.poliza.tipo_seguro.nombre,
      cobertura: row.poliza.cobertura,
      suma: Number(row.poliza.suma_asegurada),
      aseguradora: aseguradoraRefFromRow(row.poliza.aseguradora),
    },
  };
}

export async function getSiniestros(): Promise<SiniestroListItem[]> {
  const rows = await findSiniestros();
  return rows.map(toListItem);
}

export async function getSiniestroById(id: number): Promise<SiniestroFull | null> {
  const row = await findSiniestroById(id);
  if (!row) return null;
  return toFull(row);
}
