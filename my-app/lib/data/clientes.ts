import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache/tags";
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

const POLIZA_VIGENTES = ["vigente", "proxima"] as const;

type ClienteRow = Awaited<ReturnType<typeof findClientes>>[number];

function findClientes() {
  return prisma.clientes.findMany({
    orderBy: { id: "asc" },
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
      polizas: { select: { estado: true, prima_mensual: true } },
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
      (s, p) => s + Number(p.prima_mensual),
      0,
    ),
  };
}

async function getAllClientes(): Promise<ClienteListItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.clientes);
  const rows = await findClientes();
  return rows.map(toListItem);
}

export type ClientesFilters = {
  q?: string;
  tipo?: ClienteTipo;
  estado?: ClienteListItem["estado"];
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

export async function getClientes(
  filters: ClientesFilters = {},
): Promise<ClienteListItem[]> {
  const all = await getAllClientes();
  const isEmpty = !filters.q && !filters.tipo && !filters.estado;
  return isEmpty ? all : all.filter((c) => matchesFilters(c, filters));
}

export async function getClienteById(id: number): Promise<ClienteFull | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.clientes);

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
    .filter((p) => p.estado !== "anulada" && p.estado !== "vencida")
    .reduce((s, p) => s + Number(p.prima_mensual) * 12, 0);

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
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.clientes, CACHE_TAGS.polizas);

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
    },
  });

  return rows.map((row) => ({
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
  }));
}

export async function getClienteSiniestros(
  clienteId: number,
): Promise<SiniestroListItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.clientes, CACHE_TAGS.siniestros);

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
    descripcion: row.descripcion_hechos,
    cliente: clienteRefFromRow(row.poliza.cliente),
    fechaReporte: isoDateTime(row.fecha_reporte),
    estado: row.estado,
    leido: row.leido,
    docsCount: row.documentos.length,
  }));
}
