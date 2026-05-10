import { prisma } from "@/lib/prisma";
import {
  aseguradoraRefFromRow,
  clienteRefFromRow,
  isoDate,
} from "./_mappers";
import type {
  PagoFull,
  PagoListItem,
  PagoPolizaRef,
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
    prima: Number(p.prima_mensual),
    aseguradora: aseguradoraRefFromRow(p.aseguradora),
  };
}

export async function getPagos(): Promise<PagoListItem[]> {
  const rows = await findPagos();
  return rows.map(toListItem);
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
    comprobante: row.comprobante,
    cbu: row.cbu,
    polizas: row.polizas.map(toPolizaRef),
  };
}
