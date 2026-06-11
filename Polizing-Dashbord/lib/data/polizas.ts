import { prisma } from "@/lib/prisma";
import { createCachedGetter, CACHE_TAGS } from "./cache";
import { clienteIdent, clienteLabel } from "@/lib/domain/cliente-helpers";
import { derivePolizaEstado } from "@/lib/domain/poliza-status";
import {
  aseguradoraRefFromRow,
  clienteCoreFromRow,
  clienteRefFromRow,
  isoDate,
  vencimientoDays,
} from "./_mappers";
import type {
  CategoriaSeguro,
  CoberturaCatalogo,
  CoberturaRef,
  FormCliente,
  PolizaCounts,
  PolizaFormRefs,
  PolizaFull,
  PolizaListItem,
  PolizaTab,
  PolizasFilters,
} from "./types";

const POLIZA_INCLUDE = {
  cliente: {
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
    },
  },
  aseguradora: true,
  tipo_seguro: true,
  cobertura: true,
} as const;

type PolizaRow = Awaited<ReturnType<typeof findPolizas>>[number];

function findPolizas() {
  return prisma.polizas.findMany({
    orderBy: { fecha_fin_vigencia: "asc" },
    include: POLIZA_INCLUDE,
  });
}

function toCoberturaRef(c: { id: number; nombre: string }): CoberturaRef {
  return { id: c.id, nombre: c.nombre };
}

function toListItem(row: PolizaRow, now: Date): PolizaListItem {
  const fin = row.fecha_fin_vigencia ?? null;
  return {
    id: row.id,
    numero: row.numero_poliza,
    tipo: row.tipo_seguro?.nombre ?? "",
    cobertura: row.cobertura ? toCoberturaRef(row.cobertura) : { id: 0, nombre: "" },
    inicio: isoDate(row.fecha_inicio_vigencia ?? null),
    fin: isoDate(fin),
    suma: Number(row.suma_asegurada ?? 0),
    prima: Number(row.prima_mensual ?? 0),
    estado: derivePolizaEstado(row.estado, fin, now),
    diasHastaVencimiento: vencimientoDays(fin),
    cliente: clienteRefFromRow(row.cliente),
    aseguradora: aseguradoraRefFromRow(row.aseguradora),
  };
}

async function getAllPolizas(): Promise<PolizaListItem[]> {
  const rows = await findPolizas();
  const now = new Date();
  return rows.map((r) => toListItem(r, now));
}

const getAllPolizasCached = createCachedGetter(
  getAllPolizas,
  ["polizas", "all"],
  CACHE_TAGS.polizas,
);

// Con derivePolizaEstado, "proxima" ya implica 0 ≤ días ≤ 60.
function isPorVencer(p: PolizaListItem): boolean {
  return p.estado === "proxima";
}

function matchesTab(p: PolizaListItem, tab: PolizaTab | undefined): boolean {
  if (!tab || tab === "all") return true;
  if (tab === "porVencer") return isPorVencer(p);
  return p.estado === tab;
}

function matchesFilters(p: PolizaListItem, f: PolizasFilters): boolean {
  if (!matchesTab(p, f.tab)) return false;
  if (f.tipo && p.tipo !== f.tipo) return false;
  if (f.aseguradoraId !== undefined && p.aseguradora.id !== f.aseguradoraId) {
    return false;
  }
  if (f.q) {
    const q = f.q.toLowerCase();
    const haystack =
      `${p.numero} ${p.cliente.label} ${p.cliente.ident} ${p.tipo} ${p.cobertura.nombre}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export const POLIZAS_PAGE_SIZE = 20;

export type PolizasPage = {
  rows: PolizaListItem[];
  total: number;
};

export async function getPolizas(
  filters: PolizasFilters = {},
  page?: number,
): Promise<PolizasPage> {
  const all = await getAllPolizasCached();
  const isEmpty =
    !filters.q &&
    (!filters.tab || filters.tab === "all") &&
    !filters.tipo &&
    filters.aseguradoraId === undefined;
  const filtered = isEmpty ? all : all.filter((p) => matchesFilters(p, filters));
  if (filters.sortBy) {
    const direction = filters.sortDir === "desc" ? -1 : 1;
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (filters.sortBy) {
        case "numero":
          cmp = a.numero.localeCompare(b.numero);
          break;
        case "cliente":
          cmp = a.cliente.label.localeCompare(b.cliente.label);
          break;
        case "aseguradora":
          cmp = a.aseguradora.razonSocial.localeCompare(b.aseguradora.razonSocial);
          break;
      }
      return cmp * direction;
    });
  }
  if (page === undefined) {
    return { rows: filtered, total: filtered.length };
  }
  const start = page * POLIZAS_PAGE_SIZE;
  return { rows: filtered.slice(start, start + POLIZAS_PAGE_SIZE), total: filtered.length };
}

export async function getPolizaCounts(
  filters: Omit<PolizasFilters, "tab"> = {},
): Promise<PolizaCounts> {
  const all = await getAllPolizasCached();
  const scoped = all.filter((p) => matchesFilters(p, { ...filters, tab: "all" }));
  return {
    all: scoped.length,
    vigente: scoped.filter((p) => p.estado === "vigente").length,
    proxima: scoped.filter((p) => p.estado === "proxima").length,
    porVencer: scoped.filter(isPorVencer).length,
    renovada: scoped.filter((p) => p.estado === "renovada").length,
    vencida: scoped.filter((p) => p.estado === "vencida").length,
    anulada: scoped.filter((p) => p.estado === "anulada").length,
  };
}

export async function getPolizaById(id: number): Promise<PolizaFull | null> {
  const row = await prisma.polizas.findUnique({
    where: { id },
    include: POLIZA_INCLUDE,
  });
  if (!row) return null;
  return {
    ...toListItem(row, new Date()),
    tipoSeguroId: row.tipo_seguro_id,
    dominio: row.dominio ?? null,
  };
}

const getPolizaFormRefsUncached = async function (): Promise<PolizaFormRefs> {
  const [clientesRows, aseguradorasRows, tiposRows] = await Promise.all([
    prisma.clientes.findMany({
      where: { estado: "activo" },
      orderBy: { id: "asc" },
      include: {
        clientes_corporativos: true,
        clientes_no_corporativos: true,
      },
    }),
    prisma.empresas_aseguradoras.findMany({
      orderBy: { razon_social: "asc" },
      select: { id: true, razon_social: true },
    }),
    prisma.tipos_seguro.findMany({
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        categoria: true,
        coberturas: {
          orderBy: { nombre: "asc" },
          select: { id: true, nombre: true },
        },
      },
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

  const coberturasPorTipo: CoberturaCatalogo[] = tiposRows.map((t) => ({
    tipoSeguroId: t.id,
    coberturas: t.coberturas.map((c) => ({ id: c.id, nombre: c.nombre })),
  }));

  return {
    clientes,
    aseguradoras: aseguradorasRows.map((a) => ({
      id: a.id,
      razonSocial: a.razon_social,
    })),
    tiposSeguro: tiposRows.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      categoria: t.categoria as CategoriaSeguro,
    })),
    coberturasPorTipo,
  };
};

export const getPolizaFormRefs = createCachedGetter(
  getPolizaFormRefsUncached,
  ["polizas", "form-refs"],
  CACHE_TAGS.polizas,
);
