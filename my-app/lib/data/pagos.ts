import { prisma } from "@/lib/prisma";
import {
  aseguradoraRefFromRow,
  clienteRefFromRow,
  isoDate,
} from "./_mappers";
import type {
  PagoEstado,
  PagoFull,
  PagoItemDetail,
  PagoListItem,
} from "./types";

const LIST_INCLUDE = {
  clientes: {
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
    },
  },
  items: { select: { id: true } },
} as const;

const FULL_INCLUDE = {
  clientes: {
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
    },
  },
  items: {
    include: {
      polizas: {
        include: {
          poliza_empresa: { include: { empresas_aseguradoras: true } },
          tipo_poliza: true,
        },
      },
    },
  },
} as const;

type PagoListRow = Awaited<ReturnType<typeof findPagos>>[number];
type PagoFullRow = NonNullable<Awaited<ReturnType<typeof findPagoById>>>;

function findPagos() {
  return prisma.pagos.findMany({
    orderBy: { id: "desc" },
    include: LIST_INCLUDE,
  });
}

function findPagoById(id: number) {
  return prisma.pagos.findUnique({
    where: { id },
    include: FULL_INCLUDE,
  });
}

function toEstado(s: string | null): PagoEstado {
  return s === "validado" || s === "rechazado" ? s : "pendiente";
}

function toListItem(row: PagoListRow): PagoListItem | null {
  if (!row.clientes) return null;
  return {
    id: row.id,
    cliente: clienteRefFromRow(row.clientes),
    fechaEmision: isoDate(row.fecha_emision),
    periodo: row.periodo,
    estado: toEstado(row.estado),
    metodoPago: row.metodo_pago,
    montoTotal: Number(row.monto_total ?? 0),
    itemsCount: row.items.length,
  };
}

function toItemDetail(item: PagoFullRow["items"][number]): PagoItemDetail | null {
  const aseguradora = item.polizas.poliza_empresa?.empresas_aseguradoras;
  if (!aseguradora) return null;
  return {
    id: item.id,
    concepto: item.concepto,
    monto: Number(item.monto ?? 0),
    poliza: {
      id: item.polizas.id,
      numero: item.polizas.numero_poliza,
      tipo: item.polizas.tipo_poliza?.tipo_seguro_id ?? null,
      aseguradora: aseguradoraRefFromRow(aseguradora),
    },
  };
}

export async function getPagos(): Promise<PagoListItem[]> {
  const rows = await findPagos();
  return rows
    .map(toListItem)
    .filter((p): p is PagoListItem => p !== null);
}

export async function getPagoById(id: number): Promise<PagoFull | null> {
  const row = await findPagoById(id);
  if (!row || !row.clientes) return null;
  const base: PagoListItem = {
    id: row.id,
    cliente: clienteRefFromRow(row.clientes),
    fechaEmision: isoDate(row.fecha_emision),
    periodo: row.periodo,
    estado: toEstado(row.estado),
    metodoPago: row.metodo_pago,
    montoTotal: Number(row.monto_total ?? 0),
    itemsCount: row.items.length,
  };
  return {
    ...base,
    comprobante: row.comprobante,
    cbu: row.cbu,
    items: row.items
      .map(toItemDetail)
      .filter((i): i is PagoItemDetail => i !== null),
  };
}
