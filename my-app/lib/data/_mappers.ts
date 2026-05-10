import {
  clienteAvatarLetters,
  clienteIdent,
  clienteLabel,
  type ClienteCore,
} from "@/lib/domain/cliente-helpers";
import { daysUntilExpiry } from "@/lib/format/date";
import type {
  ClienteTipo,
  PolizaAseguradoraRef,
  PolizaClienteRef,
} from "./types";

type ClienteRowMin = {
  id: number;
  tipo: "corporativo" | "persona";
  clientes_corporativos: {
    cuit: string;
    razon_social: string;
  } | null;
  clientes_no_corporativos: {
    dni: string;
    nombre: string;
    apellido: string;
  } | null;
};

export function clienteRefFromRow(row: ClienteRowMin): PolizaClienteRef {
  const tipo: ClienteTipo = row.tipo === "corporativo" ? "corp" : "normal";
  const core: ClienteCore | null = row.clientes_corporativos
    ? {
        tipo: "corp",
        razonSocial: row.clientes_corporativos.razon_social,
        cuit: row.clientes_corporativos.cuit,
      }
    : row.clientes_no_corporativos
      ? {
          tipo: "normal",
          nombre: row.clientes_no_corporativos.nombre,
          apellido: row.clientes_no_corporativos.apellido,
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
  razon_social: string;
};

export function aseguradoraRefFromRow(
  row: AseguradoraRowMin,
): PolizaAseguradoraRef {
  return {
    id: row.id,
    razonSocial: row.razon_social,
  };
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isoDateTime(d: Date): string {
  return d.toISOString();
}

export function vencimientoDays(fin: Date): number | null {
  return daysUntilExpiry(fin.toISOString().slice(0, 10));
}
