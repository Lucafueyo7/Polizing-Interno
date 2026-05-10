import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache/tags";
import {
  clienteIdent,
  clienteLabel,
  type ClienteCore,
} from "@/lib/domain/cliente-helpers";
import { fmtBytes } from "@/lib/format/bytes";
import {
  aseguradoraRefFromRow,
  clienteRefFromRow,
  isoDate,
  isoDateTime,
} from "./_mappers";
import type {
  FormCliente,
  FormPolizaRef,
  SiniestroCounts,
  SiniestroDoc,
  SiniestroFormRefs,
  SiniestroFull,
  SiniestroListItem,
  SiniestroTab,
  SiniestrosFilters,
} from "./types";

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
    orderBy: { fecha_reporte: "desc" },
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

function toDoc(d: {
  id: number;
  tipo: "img" | "pdf";
  nombre: string;
  url: string;
  tamano_bytes: number | null;
}, hasAi: boolean): SiniestroDoc {
  return {
    id: d.id,
    tipo: d.tipo,
    nombre: d.nombre,
    url: d.url,
    tamano: fmtBytes(d.tamano_bytes),
    procesadoIA: hasAi && d.tipo === "img",
  };
}

function toFull(row: SiniestroFullRow): SiniestroFull {
  const hasAi = row.ai_summary !== null;
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
    docs: row.documentos.map((d) => toDoc(d, hasAi)),
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

async function getAllSiniestros(): Promise<SiniestroListItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.siniestros);
  const rows = await findSiniestros();
  return rows.map(toListItem);
}

function matchesTab(s: SiniestroListItem, tab: SiniestroTab | undefined): boolean {
  if (!tab || tab === "all") return true;
  return s.estado === tab;
}

function matchesFilters(s: SiniestroListItem, f: SiniestrosFilters): boolean {
  if (!matchesTab(s, f.tab)) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    const haystack =
      `${s.numero ?? ""} ${s.titulo ?? ""} ${s.descripcion ?? ""} ${s.cliente.label} ${s.cliente.ident}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export async function getSiniestros(
  filters: SiniestrosFilters = {},
): Promise<SiniestroListItem[]> {
  const all = await getAllSiniestros();
  const isEmpty = !filters.q && (!filters.tab || filters.tab === "all");
  return isEmpty ? all : all.filter((s) => matchesFilters(s, filters));
}

export async function getSiniestroCounts(): Promise<SiniestroCounts> {
  const all = await getAllSiniestros();
  return {
    all: all.length,
    nuevo: all.filter((s) => s.estado === "nuevo").length,
    tramite: all.filter((s) => s.estado === "tramite").length,
    cerrado: all.filter((s) => s.estado === "cerrado").length,
  };
}

const SIN_PRIORITY: Record<SiniestroListItem["estado"], number> = {
  nuevo: 0,
  tramite: 1,
  cerrado: 2,
};

export async function getPrimerSiniestro(): Promise<SiniestroListItem | null> {
  const all = await getAllSiniestros();
  if (all.length === 0) return null;
  return [...all].sort((a, b) => {
    const pa = SIN_PRIORITY[a.estado] - SIN_PRIORITY[b.estado];
    if (pa !== 0) return pa;
    if (a.leido !== b.leido) return a.leido ? 1 : -1;
    return new Date(b.fechaReporte).getTime() - new Date(a.fechaReporte).getTime();
  })[0];
}

export async function getSiniestroById(
  id: number,
): Promise<SiniestroFull | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.siniestros);
  const row = await findSiniestroById(id);
  if (!row) return null;
  return toFull(row);
}

function clienteCoreFromRow(row: {
  clientes_corporativos: { razon_social: string; cuit: string } | null;
  clientes_no_corporativos: { nombre: string; apellido: string; dni: string } | null;
}): ClienteCore | null {
  if (row.clientes_corporativos) {
    return {
      tipo: "corp",
      razonSocial: row.clientes_corporativos.razon_social,
      cuit: row.clientes_corporativos.cuit,
    };
  }
  if (row.clientes_no_corporativos) {
    return {
      tipo: "normal",
      nombre: row.clientes_no_corporativos.nombre,
      apellido: row.clientes_no_corporativos.apellido,
      dni: row.clientes_no_corporativos.dni,
    };
  }
  return null;
}

export async function getSiniestroFormRefs(): Promise<SiniestroFormRefs> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.clientes, CACHE_TAGS.polizas);

  const [clientesRows, polizasRows] = await Promise.all([
    prisma.clientes.findMany({
      where: { estado: "activo" },
      orderBy: { id: "asc" },
      include: {
        clientes_corporativos: true,
        clientes_no_corporativos: true,
      },
    }),
    prisma.polizas.findMany({
      where: { estado: { in: ["vigente", "proxima", "renovada"] } },
      orderBy: { numero_poliza: "asc" },
      include: { tipo_seguro: { select: { nombre: true } } },
    }),
  ]);

  const clientes: FormCliente[] = clientesRows
    .map((row) => {
      const core = clienteCoreFromRow(row);
      if (!core) return null;
      return {
        id: row.id,
        label: clienteLabel(core),
        ident: clienteIdent(core),
      };
    })
    .filter((c): c is FormCliente => c !== null);

  const polizas: FormPolizaRef[] = polizasRows.map((p) => ({
    id: p.id,
    numero: p.numero_poliza,
    clienteId: p.cliente_id,
    tipo: p.tipo_seguro.nombre,
    cobertura: p.cobertura,
  }));

  return { clientes, polizas };
}

export async function nextSiniestroNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SIN-${year}-`;
  const count = await prisma.siniestros.count({
    where: { numero: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}
