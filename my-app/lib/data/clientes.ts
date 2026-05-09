import { prisma } from "@/lib/prisma";
import {
  clienteIdent,
  clienteLabel,
  type ClienteCore,
} from "@/lib/domain/cliente-helpers";
import type {
  ClienteEstado,
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
      poliza_cliente: {
        include: {
          polizas: { select: { estado: true, prima_mensual: true } },
        },
      },
    },
  });
}

function asCore(row: ClienteRow): ClienteCore | null {
  if (row.clientes_corporativos) {
    return {
      tipo: "corp",
      razonSocial: row.clientes_corporativos.razon_social ?? "",
      cuit: row.clientes_corporativos.cuit,
    };
  }
  if (row.clientes_no_corporativos) {
    return {
      tipo: "normal",
      nombre: row.clientes_no_corporativos.nombre ?? "",
      apellido: row.clientes_no_corporativos.apellido ?? "",
      dni: row.clientes_no_corporativos.dni,
    };
  }
  return null;
}

function tipoOf(row: ClienteRow): ClienteTipo {
  return row.clientes_corporativos ? "corp" : "normal";
}

function isoDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

function toListItem(row: ClienteRow): ClienteListItem {
  const core = asCore(row);
  const polizas = row.poliza_cliente
    .map((pc) => pc.polizas)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const polizasActivas = polizas.filter(
    (p) => p.estado && (POLIZA_VIGENTES as readonly string[]).includes(p.estado),
  );
  return {
    id: row.id,
    tipo: tipoOf(row),
    label: core ? clienteLabel(core) : `Cliente #${row.id}`,
    ident: core ? clienteIdent(core) : "",
    email: row.email,
    telefono: row.telefono,
    estado: (row.estado as ClienteEstado | null) ?? null,
    desde: isoDate(row.fecha_alta),
    polizasActivas: polizasActivas.length,
    primaMensual: polizasActivas.reduce(
      (s, p) => s + Number(p.prima_mensual ?? 0),
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
      poliza_cliente: {
        include: {
          polizas: { select: { estado: true, prima_mensual: true } },
        },
      },
    },
  });
  if (!row) return null;

  const base = toListItem(row);
  const siniestrosCount = await prisma.siniestros_poliza.count({
    where: { polizas: { poliza_cliente: { cliente_id: id } } },
  });
  const polizas = row.poliza_cliente
    .map((pc) => pc.polizas)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const primaAnualizada = polizas
    .filter(
      (p) => p.estado && p.estado !== "anulada" && p.estado !== "vencida",
    )
    .reduce((s, p) => s + Number(p.prima_mensual ?? 0) * 12, 0);

  return {
    ...base,
    direccion: row.direccion,
    contactoNombre: row.clientes_corporativos?.contacto_nombre ?? null,
    primaAnualizada,
    siniestrosCount,
  };
}
