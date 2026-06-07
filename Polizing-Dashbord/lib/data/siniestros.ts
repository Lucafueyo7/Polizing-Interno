import { prisma } from "@/lib/prisma";
import { signedUrlForDoc } from "@/lib/storage/supabase";
import {
  clienteIdent,
  clienteLabel,
} from "@/lib/domain/cliente-helpers";
import { fmtBytes } from "@/lib/format/bytes";
import {
  aseguradoraRefFromRow,
  clienteCoreFromRow,
  clienteRefFromRow,
  isoDate,
  isoDateTime,
} from "./_mappers";
import type {
  CoberturaRef,
  FormCliente,
  FormPolizaRef,
  SiniestroCounts,
  SiniestroDoc,
  SiniestroFormRefs,
  SiniestroFull,
  SiniestroListItem,
  SiniestroTab,
  SiniestrosFilters,
} from "./types";

const LIST_INCLUDE = {
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
} as const;

const FULL_INCLUDE = {
  documentos: true,
  poliza: {
    include: {
      cliente: {
        include: {
          clientes_corporativos: true,
          clientes_no_corporativos: true,
        },
      },
      aseguradora: true,
      tipo_seguro: true,
      cobertura: true,
    },
  },
} as const;

type SiniestroListRow = Awaited<ReturnType<typeof findSiniestros>>[number];
type SiniestroFullRow = NonNullable<
  Awaited<ReturnType<typeof findSiniestroById>>
>;

function findSiniestros() {
  return prisma.siniestros.findMany({
    orderBy: { fecha_reporte: "desc" },
    include: LIST_INCLUDE,
  });
}

function findSiniestroById(id: number) {
  return prisma.siniestros.findUnique({
    where: { id },
    include: FULL_INCLUDE,
  });
}

function toCoberturaRef(c: { id: number; nombre: string }): CoberturaRef {
  return { id: c.id, nombre: c.nombre };
}

function toListItemBase(row: SiniestroListRow): Omit<SiniestroListItem, "leidoPorMi"> {
  return {
    id: row.id,
    numero: row.numero,
    titulo: row.titulo,
    cliente: clienteRefFromRow(row.poliza.cliente),
    fechaReporte: isoDateTime(row.fecha_reporte),
    estado: row.estado,
    docsCount: row.documentos.length,
  };
}

type ResolvedDoc = {
  id: number;
  tipo: "img" | "pdf";
  nombre: string;
  resolvedUrl: string | null;
  tamano_bytes: number | null;
};

function toDoc(d: ResolvedDoc): SiniestroDoc {
  return {
    id: d.id,
    tipo: d.tipo,
    nombre: d.nombre,
    url: d.resolvedUrl ?? "",
    tamano: fmtBytes(d.tamano_bytes),
    /** Por ahora la integración con la API de IA es aspiracional. */
    procesadoIA: false,
  };
}

function toFull(row: SiniestroFullRow, docs: ResolvedDoc[], leidoPorMi: boolean): SiniestroFull {
  return {
    ...toListItemBase(row),
    leidoPorMi,
    fechaOcurrencia: isoDate(row.fecha_ocurrencia),
    docs: docs.map(toDoc),
    poliza: {
      id: row.poliza.id,
      numero: row.poliza.numero_poliza,
      tipo: row.poliza.tipo_seguro?.nombre ?? "",
      cobertura: row.poliza.cobertura ? toCoberturaRef(row.poliza.cobertura) : { id: 0, nombre: "" },
      suma: Number(row.poliza.suma_asegurada ?? 0),
      aseguradora: aseguradoraRefFromRow(row.poliza.aseguradora),
    },
  };
}

async function resolveDocUrls(
  docs: Array<{ id: number; tipo: "img" | "pdf"; nombre: string; url: string | null; tamano_bytes: number | null }>,
): Promise<ResolvedDoc[]> {
  return Promise.all(
    docs.map(async (d) => ({
      id: d.id,
      tipo: d.tipo,
      nombre: d.nombre,
      resolvedUrl: d.url ? ((await signedUrlForDoc(d.url)) ?? d.url) : null,
      tamano_bytes: d.tamano_bytes,
    })),
  );
}

async function getLecturasByUser(userId: number | undefined): Promise<Set<number>> {
  if (!userId) return new Set<number>();
  const rows = await prisma.siniestro_lecturas.findMany({
    where: { usuario_id: userId },
    select: { siniestro_id: true },
  });
  return new Set(rows.map((r) => r.siniestro_id));
}

async function getAllSiniestros(): Promise<Omit<SiniestroListItem, "leidoPorMi">[]> {
  const rows = await findSiniestros();
  return rows.map(toListItemBase);
}

async function getEnrichedSiniestros(
  userId: number | undefined,
): Promise<SiniestroListItem[]> {
  const [base, leidos] = await Promise.all([
    getAllSiniestros(),
    getLecturasByUser(userId),
  ]);
  return base.map((s) => ({ ...s, leidoPorMi: leidos.has(s.id) }));
}

function matchesTab(s: SiniestroListItem, tab: SiniestroTab | undefined): boolean {
  if (!tab || tab === "all") return true;
  return s.estado === tab;
}

function matchesFilters(s: SiniestroListItem, f: SiniestrosFilters): boolean {
  if (!matchesTab(s, f.tab)) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    const haystack =
      `${s.numero ?? ""} ${s.titulo ?? ""} ${s.cliente.label} ${s.cliente.ident}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export async function getSiniestros(
  filters: SiniestrosFilters = {},
  userId?: number,
): Promise<SiniestroListItem[]> {
  const all = await getEnrichedSiniestros(userId);
  const isEmpty = !filters.q && (!filters.tab || filters.tab === "all");
  return isEmpty ? all : all.filter((s) => matchesFilters(s, filters));
}

export async function getSiniestroCounts(): Promise<SiniestroCounts> {
  const all = await getAllSiniestros();
  return {
    all: all.length,
    nuevo: all.filter((s) => s.estado === "nuevo").length,
    pendiente_documentacion: all.filter((s) => s.estado === "pendiente_documentacion").length,
    en_tramite: all.filter((s) => s.estado === "en_tramite").length,
    cerrado: all.filter((s) => s.estado === "cerrado").length,
    rechazado: all.filter((s) => s.estado === "rechazado").length,
  };
}

const SIN_PRIORITY: Record<SiniestroListItem["estado"], number> = {
  nuevo: 0,
  pendiente_documentacion: 1,
  en_tramite: 2,
  cerrado: 3,
  rechazado: 4,
};

export async function getPrimerSiniestro(
  userId?: number,
): Promise<SiniestroListItem | null> {
  const all = await getEnrichedSiniestros(userId);
  if (all.length === 0) return null;
  return [...all].sort((a, b) => {
    const pa = SIN_PRIORITY[a.estado] - SIN_PRIORITY[b.estado];
    if (pa !== 0) return pa;
    if (a.leidoPorMi !== b.leidoPorMi) return a.leidoPorMi ? 1 : -1;
    return new Date(b.fechaReporte).getTime() - new Date(a.fechaReporte).getTime();
  })[0];
}

export async function getSiniestroById(
  id: number,
  userId?: number,
): Promise<SiniestroFull | null> {
  const row = await findSiniestroById(id);
  if (!row) return null;
  let leidoPorMi = false;
  if (userId) {
    const lectura = await prisma.siniestro_lecturas.findUnique({
      where: { siniestro_id_usuario_id: { siniestro_id: id, usuario_id: userId } },
      select: { leido_en: true },
    });
    leidoPorMi = lectura !== null;
  }
  const docs = await resolveDocUrls(row.documentos);
  return toFull(row, docs, leidoPorMi);
}

export async function getSiniestroFormRefs(): Promise<SiniestroFormRefs> {
  const [clientesRows, polizasRows] = await Promise.all([
    prisma.clientes.findMany({
      where: { estado: "activo" },
      orderBy: { id: "asc" },
      include: {
        clientes_corporativos: true,
        clientes_no_corporativos: true,
      },
    }),
    prisma.polizas.findMany({
      where: { estado: { in: ["vigente", "proxima", "renovada"] } },
      orderBy: { numero_poliza: "asc" },
      include: {
        tipo_seguro: { select: { nombre: true } },
        cobertura: { select: { id: true, nombre: true } },
      },
    }),
  ]);

  const clientes: FormCliente[] = clientesRows
    .map((row) => {
      const core = clienteCoreFromRow(row);
      if (!core) return null;
      return {
        id: row.id,
        label: clienteLabel(core),
        ident: clienteIdent(core),
      };
    })
    .filter((c): c is FormCliente => c !== null);

  const polizas: FormPolizaRef[] = polizasRows.map((p) => ({
    id: p.id,
    numero: p.numero_poliza,
    clienteId: p.cliente_id,
    tipo: p.tipo_seguro?.nombre ?? "",
    cobertura: p.cobertura ? { id: p.cobertura.id, nombre: p.cobertura.nombre } : { id: 0, nombre: "" },
  }));

  return { clientes, polizas };
}

export async function nextSiniestroNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SIN-${year}-`;
  const count = await prisma.siniestros.count({
    where: { numero: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}
