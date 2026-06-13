"use server";

import { getClientes } from "./clientes";
import { getPagos } from "./pagos";
import { getPolizas } from "./polizas";
import { getSiniestros } from "./siniestros";

const LIMIT = 5;

export type SearchHit = {
  id: number;
  title: string;
  subtitle: string;
  href: string;
};

export type GlobalSearchResults = {
  clientes: SearchHit[];
  polizas: SearchHit[];
  siniestros: SearchHit[];
  pagos: SearchHit[];
};

const EMPTY: GlobalSearchResults = {
  clientes: [],
  polizas: [],
  siniestros: [],
  pagos: [],
};

/** Búsqueda global: reusa los getters por dominio (filtro `q` in-memory) y
 * devuelve un resumen seccionado con los primeros resultados de cada área. */
export async function searchGlobal(qRaw: string): Promise<GlobalSearchResults> {
  const q = qRaw.trim();
  if (q.length < 2) return EMPTY;

  const [clientes, polizas, siniestros, pagos] = await Promise.all([
    getClientes({ q }),
    getPolizas({ q }),
    getSiniestros({ q }),
    getPagos({ q }),
  ]);

  return {
    clientes: clientes.rows.slice(0, LIMIT).map((c) => ({
      id: c.id,
      title: c.label,
      subtitle: c.ident,
      href: `/clientes/${c.id}`,
    })),
    polizas: polizas.rows.slice(0, LIMIT).map((p) => ({
      id: p.id,
      title: p.numero,
      subtitle: `${p.cliente.label} · ${p.tipo}`,
      href: `/polizas/${p.id}`,
    })),
    siniestros: siniestros.slice(0, LIMIT).map((s) => ({
      id: s.id,
      title: s.numero,
      subtitle: s.titulo,
      href: `/siniestros/${s.id}`,
    })),
    pagos: pagos.slice(0, LIMIT).map((p) => ({
      id: p.id,
      title: `PAY-${String(p.id).padStart(5, "0")}`,
      subtitle: p.cliente.label,
      href: `/pagos/${p.id}`,
    })),
  };
}
