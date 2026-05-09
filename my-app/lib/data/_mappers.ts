import {
  clienteAvatarLetters,
  clienteIdent,
  clienteLabel,
  type ClienteCore,
} from "@/lib/domain/cliente-helpers";
import type { PolizaEstado } from "@/lib/domain/poliza-status";
import { daysUntilExpiry } from "@/lib/format/date";
import type {
  ClienteTipo,
  PolizaAseguradoraRef,
  PolizaClienteRef,
} from "./types";

type ClienteRowMin = {
  id: number;
  clientes_corporativos: {
    cuit: string;
    razon_social: string | null;
  } | null;
  clientes_no_corporativos: {
    dni: string;
    nombre: string | null;
    apellido: string | null;
  } | null;
};

export function clienteRefFromRow(row: ClienteRowMin): PolizaClienteRef {
  const tipo: ClienteTipo = row.clientes_corporativos ? "corp" : "normal";
  const core: ClienteCore | null = row.clientes_corporativos
    ? {
        tipo: "corp",
        razonSocial: row.clientes_corporativos.razon_social ?? "",
        cuit: row.clientes_corporativos.cuit,
      }
    : row.clientes_no_corporativos
      ? {
          tipo: "normal",
          nombre: row.clientes_no_corporativos.nombre ?? "",
          apellido: row.clientes_no_corporativos.apellido ?? "",
          dni: row.clientes_no_corporativos.dni,
        }
      : null;
  return {
    id: row.id,
    tipo,
    label: core ? clienteLabel(core) : `Cliente #${row.id}`,
    ident: core ? clienteIdent(core) : "",
    avatarLetters: core ? clienteAvatarLetters(core) : "?",
  };
}

type AseguradoraRowMin = {
  id: number;
  razon_social: string | null;
  color_hex: string | null;
};

export function aseguradoraRefFromRow(
  row: AseguradoraRowMin,
): PolizaAseguradoraRef {
  return {
    id: row.id,
    razonSocial: row.razon_social ?? "",
    color: row.color_hex ?? "#5b6677",
  };
}

export function isoDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export function isoDateTime(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export function toPolizaEstado(s: string | null): PolizaEstado {
  switch (s) {
    case "vigente":
    case "proxima":
    case "vencida":
    case "anulada":
    case "renovada":
      return s;
    default:
      return "vigente";
  }
}

export function vencimientoDays(fin: Date | null): number | null {
  if (!fin) return null;
  return daysUntilExpiry(fin.toISOString().slice(0, 10));
}
