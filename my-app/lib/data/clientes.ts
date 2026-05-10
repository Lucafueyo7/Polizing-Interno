import { prisma } from "@/lib/prisma";
import {
  clienteIdent,
  clienteLabel,
  type ClienteCore,
} from "@/lib/domain/cliente-helpers";
import { isoDate } from "./_mappers";
import type {
  ClienteFull,
  ClienteListItem,
  ClienteTipo,
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

export async function getClientes(): Promise<ClienteListItem[]> {
  const rows = await findClientes();
  return rows.map(toListItem);
}

export async function getClienteById(id: number): Promise<ClienteFull | null> {
  const row = await prisma.clientes.findUnique({
    where: { id },
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
      polizas: {
        select: {
          id: true,
          estado: true,
          prima_mensual: true,
        },
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
  };
}
