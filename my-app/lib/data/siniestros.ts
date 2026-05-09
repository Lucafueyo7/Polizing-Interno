import { prisma } from "@/lib/prisma";
import type { SiniestroEstado } from "@/lib/domain/poliza-status";
import {
  aseguradoraRefFromRow,
  clienteRefFromRow,
  isoDate,
  isoDateTime,
} from "./_mappers";
import type { SiniestroDoc, SiniestroFull, SiniestroListItem } from "./types";

const LIST_INCLUDE = {
  documentos: { select: { id: true } },
  siniestros_poliza: {
    include: {
      polizas: {
        include: {
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
        },
      },
    },
  },
} as const;

const FULL_INCLUDE = {
  documentos: true,
  siniestros_poliza: {
    include: {
      polizas: {
        include: {
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
          poliza_empresa: { include: { empresas_aseguradoras: true } },
          tipo_poliza: true,
        },
      },
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

function toEstado(s: string | null): SiniestroEstado {
  return s === "tramite" || s === "cerrado" ? s : "nuevo";
}

function toFuente(s: string | null): "whatsapp" | "email" | null {
  return s === "whatsapp" || s === "email" ? s : null;
}

function clienteRef(row: SiniestroListRow) {
  const cliente = row.siniestros_poliza[0]?.polizas?.poliza_cliente?.clientes;
  if (!cliente) return null;
  return clienteRefFromRow(cliente);
}

function toListItem(row: SiniestroListRow): SiniestroListItem | null {
  const cliente = clienteRef(row);
  if (!cliente) return null;
  return {
    id: row.id,
    numero: row.numero,
    titulo: row.titulo,
    descripcion: row.descripcion_hechos,
    cliente,
    fechaReporte: isoDateTime(row.fecha_reporte),
    estado: toEstado(row.estado),
    fuente: toFuente(row.fuente),
    leido: row.leido,
    docsCount: row.documentos.length,
  };
}

function toDoc(d: { tipo: string; nombre: string; tamano: string | null; procesado_ia: boolean }): SiniestroDoc {
  return {
    tipo: d.tipo === "img" ? "img" : "pdf",
    nombre: d.nombre,
    tamano: d.tamano,
    procesadoIA: d.procesado_ia,
  };
}

function toFull(row: SiniestroFullRow): SiniestroFull | null {
  const polizaRow = row.siniestros_poliza[0]?.polizas;
  const cliente = polizaRow?.poliza_cliente?.clientes;
  if (!cliente) return null;
  const aseguradora = polizaRow.poliza_empresa?.empresas_aseguradoras;
  const base: SiniestroListItem = {
    id: row.id,
    numero: row.numero,
    titulo: row.titulo,
    descripcion: row.descripcion_hechos,
    cliente: clienteRefFromRow(cliente),
    fechaReporte: isoDateTime(row.fecha_reporte),
    estado: toEstado(row.estado),
    fuente: toFuente(row.fuente),
    leido: row.leido,
    docsCount: row.documentos.length,
  };
  return {
    ...base,
    fechaOcurrencia: isoDate(row.fecha_ocurrencia),
    aiSummary: row.ai_summary,
    docs: row.documentos.map(toDoc),
    poliza: aseguradora
      ? {
          id: polizaRow.id,
          numero: polizaRow.numero_poliza,
          tipo: polizaRow.tipo_poliza?.tipo_seguro_id ?? null,
          cobertura: polizaRow.cobertura,
          suma: Number(polizaRow.suma_asegurada ?? 0),
          aseguradora: aseguradoraRefFromRow(aseguradora),
        }
      : null,
  };
}

export async function getSiniestros(): Promise<SiniestroListItem[]> {
  const rows = await findSiniestros();
  return rows
    .map(toListItem)
    .filter((s): s is SiniestroListItem => s !== null);
}

export async function getSiniestroById(id: number): Promise<SiniestroFull | null> {
  const row = await findSiniestroById(id);
  if (!row) return null;
  return toFull(row);
}
