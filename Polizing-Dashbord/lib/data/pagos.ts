import { prisma } from "@/lib/prisma";
import {
  aseguradoraRefFromRow,
  clienteRefFromRow,
  isoDate,
} from "./_mappers";
import type {
  CoberturaRef,
  PagoCounts,
  PagoFull,
  PagoListItem,
  PagoPolizaRef,
  PagoTab,
  PagosFilters,
  PagosSummary,
} from "./types";

const LIST_INCLUDE = {
  cliente: {
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
    },
  },
  polizas: { select: { id: true } },
} as const;

const FULL_INCLUDE = {
  cliente: {
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
    },
  },
  polizas: {
    include: {
      aseguradora: true,
      tipo_seguro: true,
      cobertura: true,
    },
  },
} as const;

type PagoListRow = Awaited<ReturnType<typeof findPagos>>[number];
type PagoFullRow = NonNullable<Awaited<ReturnType<typeof findPagoById>>>;

function findPagos() {
  return prisma.pagos.findMany({
    orderBy: [{ fecha_pago: { sort: "desc", nulls: "first" } }, { id: "desc" }],
    include: LIST_INCLUDE,
  });
}

function findPagoById(id: number) {
  return prisma.pagos.findUnique({
    where: { id },
    include: FULL_INCLUDE,
  });
}

function toCoberturaRef(c: { id: number; nombre: string }): CoberturaRef {
  return { id: c.id, nombre: c.nombre };
}

function toListItem(row: PagoListRow): PagoListItem {
  return {
    id: row.id,
    cliente: clienteRefFromRow(row.cliente),
    fechaPago: row.fecha_pago ? isoDate(row.fecha_pago) : null,
    estado: row.estado,
    metodoPago: row.metodo_pago,
    monto: Number(row.monto),
    polizasCount: row.polizas.length,
  };
}

function toPolizaRef(p: PagoFullRow["polizas"][number]): PagoPolizaRef {
  return {
    id: p.id,
    numero: p.numero_poliza,
    tipo: p.tipo_seguro.nombre,
    cobertura: toCoberturaRef(p.cobertura),
    concepto: `Prima mensual · ${p.tipo_seguro.nombre}`,
    prima: Number(p.prima_mensual),
    aseguradora: aseguradoraRefFromRow(p.aseguradora),
  };
}

async function getAllPagos(): Promise<PagoListItem[]> {
  const rows = await findPagos();
  return rows.map(toListItem);
}

function matchesTab(p: PagoListItem, tab: PagoTab | undefined): boolean {
  if (!tab || tab === "all") return true;
  return p.estado === tab;
}

export async function getPagos(
  filters: PagosFilters = {},
): Promise<PagoListItem[]> {
  const all = await getAllPagos();
  if (!filters.tab || filters.tab === "all") return all;
  return all.filter((p) => matchesTab(p, filters.tab));
}

export async function getPagoCounts(): Promise<PagoCounts> {
  const all = await getAllPagos();
  return {
    all: all.length,
    pendiente: all.filter((p) => p.estado === "pendiente").length,
    validado: all.filter((p) => p.estado === "validado").length,
    rechazado: all.filter((p) => p.estado === "rechazado").length,
  };
}

export async function getPagosSummary(): Promise<PagosSummary> {
  const all = await getAllPagos();
  const pendientes = all.filter((p) => p.estado === "pendiente");
  const validados = all.filter((p) => p.estado === "validado");
  const empresas = new Set(all.map((p) => p.cliente.id));
  return {
    pendienteTotal: pendientes.reduce((s, p) => s + p.monto, 0),
    pendienteCount: pendientes.length,
    validadoTotal: validados.reduce((s, p) => s + p.monto, 0),
    polizasAlcanzadas: all.reduce((s, p) => s + p.polizasCount, 0),
    operaciones: all.length,
    empresas: empresas.size,
  };
}

const PAGO_PRIORITY: Record<PagoListItem["estado"], number> = {
  pendiente: 0,
  validado: 1,
  rechazado: 2,
};

export async function getPrimerPago(): Promise<PagoListItem | null> {
  const all = await getAllPagos();
  if (all.length === 0) return null;
  return [...all].sort(
    (a, b) => PAGO_PRIORITY[a.estado] - PAGO_PRIORITY[b.estado],
  )[0];
}

export async function getPagoById(id: number): Promise<PagoFull | null> {
  const row = await findPagoById(id);
  if (!row) return null;
  const base: PagoListItem = {
    id: row.id,
    cliente: clienteRefFromRow(row.cliente),
    fechaPago: row.fecha_pago ? isoDate(row.fecha_pago) : null,
    estado: row.estado,
    metodoPago: row.metodo_pago,
    monto: Number(row.monto),
    polizasCount: row.polizas.length,
  };
  return {
    ...base,
    polizas: row.polizas.map(toPolizaRef),
  };
}
