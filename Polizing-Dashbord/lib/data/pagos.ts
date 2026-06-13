import { prisma } from "@/lib/prisma";
import { PAGOS_BUCKET, signedUrlForDoc } from "@/lib/storage/supabase";
import { fmtBytes } from "@/lib/format/bytes";
import { createCachedGetter, CACHE_TAGS } from "./cache";
import {
  aseguradoraRefFromRow,
  clienteRefFromRow,
  isoDate,
} from "./_mappers";
import type {
  CoberturaRef,
  PagoCounts,
  PagoDoc,
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
  pago_polizas: { select: { poliza_id: true } },
} as const;

const FULL_INCLUDE = {
  cliente: {
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
    },
  },
  pago_polizas: {
    include: {
      poliza: {
        include: {
          aseguradora: true,
          tipo_seguro: true,
          cobertura: true,
        },
      },
    },
  },
  documentos: true,
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
    polizasCount: row.pago_polizas.length,
  };
}

function toPolizaRef(p: PagoFullRow["pago_polizas"][number]["poliza"]): PagoPolizaRef {
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

const getAllPagosCached = createCachedGetter(
  getAllPagosImpl,
  ["pagos", "all"],
  CACHE_TAGS.pagos,
);

async function getAllPagosImpl(): Promise<PagoListItem[]> {
  const rows = await findPagos();
  return rows.map(toListItem);
}

async function getAllPagos(): Promise<PagoListItem[]> {
  return getAllPagosCached();
}

function matchesTab(p: PagoListItem, tab: PagoTab | undefined): boolean {
  if (!tab || tab === "all") return true;
  return p.estado === tab;
}

function matchesQuery(p: PagoListItem, q: string | undefined): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const reference = `PAY-${String(p.id).padStart(5, "0")}`;
  const haystack = `${reference} ${p.cliente.label} ${p.cliente.ident}`.toLowerCase();
  return haystack.includes(needle);
}

export async function getPagos(
  filters: PagosFilters = {},
): Promise<PagoListItem[]> {
  const all = await getAllPagos();
  return all.filter(
    (p) => matchesTab(p, filters.tab) && matchesQuery(p, filters.q?.trim() || undefined),
  );
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

export async function getPrimerPago(tab?: PagoTab): Promise<PagoListItem | null> {
  const all = await getPagos({ tab });
  if (all.length === 0) return null;
  return [...all].sort(
    (a, b) => PAGO_PRIORITY[a.estado] - PAGO_PRIORITY[b.estado],
  )[0];
}

async function resolvePagoDocs(row: PagoFullRow): Promise<PagoDoc[]> {
  // Comprobantes nuevos viven en Supabase Storage (bucket pagos).
  const docs = await Promise.all(
    row.documentos.map(async (d): Promise<PagoDoc> => {
      const [view, download] = d.url
        ? await Promise.all([
            signedUrlForDoc(d.url, { bucket: PAGOS_BUCKET }),
            signedUrlForDoc(d.url, { bucket: PAGOS_BUCKET, download: d.nombre }),
          ])
        : [null, null];
      return {
        id: d.id,
        tipo: d.tipo,
        nombre: d.nombre,
        url: view ?? (d.url || ""),
        downloadUrl: download ?? view ?? (d.url || ""),
        tamano: fmtBytes(d.tamano_bytes),
      };
    }),
  );

  // Compatibilidad: pagos antiguos guardaban un único comprobante inline como
  // BLOB en la tabla. Se sirve por un route que streamea los bytes.
  if (docs.length === 0 && row.comprobante_contenido) {
    const href = `/api/pagos/${row.id}/comprobante`;
    docs.push({
      id: 0,
      tipo: row.comprobante_mime?.startsWith("image/") ? "img" : "pdf",
      nombre: row.comprobante_nombre ?? `comprobante-${row.id}`,
      url: href,
      downloadUrl: href,
      tamano: fmtBytes(row.comprobante_contenido.length),
    });
  }
  return docs;
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
    polizasCount: row.pago_polizas.length,
  };
  return {
    ...base,
    polizas: row.pago_polizas.map((pp) => toPolizaRef(pp.poliza)),
    docs: await resolvePagoDocs(row),
  };
}
