import { prisma } from "@/lib/prisma";
import { createCachedGetter, CACHE_TAGS } from "./cache";
import {
  clienteAvatarLetters,
  clienteIdent,
  clienteLabel,
  type ClienteCore,
} from "@/lib/domain/cliente-helpers";
import {
  aseguradoraRefFromRow,
  clienteRefFromRow,
  isoDate,
  isoDateTime,
  vencimientoDays,
} from "./_mappers";
import type {
  ClienteFull,
  ClienteListItem,
  ClienteTipo,
  PolizaListItem,
  SiniestroListItem,
} from "./types";
import { derivePolizaEstado, type SiniestroEstado } from "@/lib/domain/poliza-status";

const POLIZA_VIGENTES = ["vigente"] as const;

type ClienteRow = Awaited<ReturnType<typeof findClientes>>[number];

function findClientes() {
  return prisma.clientes.findMany({
    orderBy: { id: "asc" },
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
      polizas: { select: { estado: true, prima_mensual: true, aseguradora_id: true } },
    },
  });
}

function asCore(row: ClienteRow): ClienteCore | null {
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

function tipoOf(row: ClienteRow): ClienteTipo {
  return row.tipo === "corporativo" ? "corp" : "normal";
}

function toListItem(row: ClienteRow): ClienteListItem {
  const core = asCore(row);
  const polizasActivas = row.polizas.filter((p) =>
    (POLIZA_VIGENTES as readonly string[]).includes(p.estado),
  );
  return {
    id: row.id,
    tipo: tipoOf(row),
    label: core ? clienteLabel(core) : `Cliente #${row.id}`,
    ident: core ? clienteIdent(core) : "",
    avatarLetters: core ? clienteAvatarLetters(core) : "?",
    email: row.email,
    telefono: row.telefono,
    estado: row.estado,
    desde: isoDate(row.fecha_alta),
    polizasActivas: polizasActivas.length,
    primaMensual: polizasActivas.reduce(
      (s, p) => s + Number(p.prima_mensual ?? 0),
      0,
    ),
  };
}

const getAllClientesCached = createCachedGetter(
  getAllClientesImpl,
  ["clientes", "all"],
  CACHE_TAGS.clientes,
);

async function getAllClientesImpl(aseguradoraId?: string): Promise<ClienteListItem[]> {
  const rows = await findClientes();
  const filteredRows = aseguradoraId
    ? rows.filter((row) =>
        row.polizas.some((p) => String(p.aseguradora_id) === aseguradoraId),
      )
    : rows;
  return filteredRows.map(toListItem);
}

async function getAllClientes(aseguradoraId?: string): Promise<ClienteListItem[]> {
  return getAllClientesCached(aseguradoraId);
}

export type ClientesFilters = {
  q?: string;
  tipo?: ClienteTipo;
  estado?: ClienteListItem["estado"];
  aseguradoraId?: string;
  sortBy?: "label" | "ident" | "prima" | "polizas";
  sortDir?: "asc" | "desc";
};

function matchesFilters(c: ClienteListItem, f: ClientesFilters): boolean {
  if (f.tipo && c.tipo !== f.tipo) return false;
  if (f.estado && c.estado !== f.estado) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    const haystack =
      `${c.label} ${c.ident} ${c.email ?? ""} ${c.telefono ?? ""}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export const CLIENTES_PAGE_SIZE = 20;

export type ClientesPage = {
  rows: ClienteListItem[];
  total: number;
};

export async function getClientes(
  filters: ClientesFilters = {},
  page?: number,
): Promise<ClientesPage> {
  const all = await getAllClientes(filters.aseguradoraId);
  const isEmpty = !filters.q && !filters.tipo && !filters.estado && !filters.aseguradoraId;
  const filtered = isEmpty ? all : all.filter((c) => matchesFilters(c, filters));
  if (filters.sortBy) {
    const direction = filters.sortDir === "desc" ? -1 : 1;
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (filters.sortBy) {
        case "label":
          cmp = a.label.localeCompare(b.label);
          break;
        case "ident":
          cmp = a.ident.localeCompare(b.ident);
          break;
        case "prima":
          cmp = a.primaMensual - b.primaMensual;
          break;
        case "polizas":
          cmp = a.polizasActivas - b.polizasActivas;
          break;
      }
      return cmp * direction;
    });
  }
  if (page === undefined) {
    return { rows: filtered, total: filtered.length };
  }
  const start = page * CLIENTES_PAGE_SIZE;
  return { rows: filtered.slice(start, start + CLIENTES_PAGE_SIZE), total: filtered.length };
}

export async function getClienteById(id: number): Promise<ClienteFull | null> {
  const row = await prisma.clientes.findUnique({
    where: { id },
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
      polizas: {
        select: { id: true, estado: true, prima_mensual: true },
      },
    },
  });
  if (!row) return null;

  const polizaIds = row.polizas.map((p) => p.id);
  const siniestrosCount = polizaIds.length
    ? await prisma.siniestros.count({ where: { poliza_id: { in: polizaIds } } })
    : 0;

  const base = toListItem(row);
  const primaAnualizada = row.polizas
    .filter((p) => p.estado !== "vencida")
    .reduce((s, p) => s + Number(p.prima_mensual ?? 0) * 12, 0);

  return {
    ...base,
    direccion: row.direccion,
    contactoNombre: row.clientes_corporativos?.contacto_nombre ?? null,
    primaAnualizada,
    siniestrosCount,
    razonSocial: row.clientes_corporativos?.razon_social ?? null,
    cuit: row.clientes_corporativos?.cuit ?? null,
    nombre: row.clientes_no_corporativos?.nombre ?? null,
    apellido: row.clientes_no_corporativos?.apellido ?? null,
    dni: row.clientes_no_corporativos?.dni ?? null,
  };
}

export async function getClienteContrataciones(
  clienteId: number,
): Promise<PolizaListItem[]> {
  const rows = await prisma.polizas.findMany({
    where: { cliente_id: clienteId },
    orderBy: { fecha_inicio_vigencia: "desc" },
    include: {
      cliente: {
        include: {
          clientes_corporativos: true,
          clientes_no_corporativos: true,
        },
      },
      aseguradora: true,
      tipo_seguro: true,
      cobertura: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    numero: row.numero_poliza,
    tipo: row.tipo_seguro?.nombre ?? "",
    cobertura: row.cobertura ? { id: row.cobertura.id, nombre: row.cobertura.nombre } : { id: 0, nombre: "" },
    inicio: isoDate(row.fecha_inicio_vigencia ?? null),
    fin: isoDate(row.fecha_fin_vigencia ?? null),
    suma: Number(row.suma_asegurada ?? 0),
    prima: Number(row.prima_mensual ?? 0),
    estado: derivePolizaEstado(row.estado, row.fecha_fin_vigencia ?? null),
    diasHastaVencimiento: vencimientoDays(row.fecha_fin_vigencia),
    cliente: clienteRefFromRow(row.cliente),
    aseguradora: aseguradoraRefFromRow(row.aseguradora),
  }));
}

export async function getClienteSiniestros(
  clienteId: number,
): Promise<SiniestroListItem[]> {
  const rows = await prisma.siniestros.findMany({
    where: { poliza: { cliente_id: clienteId } },
    orderBy: { fecha_reporte: "desc" },
    include: {
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
    },
  });

  return rows.map((row) => ({
    id: row.id,
    numero: row.numero,
    titulo: row.titulo,
    cliente: clienteRefFromRow(row.poliza.cliente),
    fechaReporte: isoDateTime(row.fecha_reporte),
    estado: row.estado as unknown as SiniestroEstado,
    leidoPorMi: false,
    docsCount: row.documentos.length,
  }));
}
