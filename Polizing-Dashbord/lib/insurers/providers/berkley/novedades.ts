/**
 * Orquestación del sync diario de Berkley (iteración 2: enriquecimiento completo).
 *
 * Patrón "diario incremental" del manual §2.8 / §6.1:
 *  1. FechaDesde = max(ultimaCorrida-1, hoy-7) (overlap de seguridad).
 *  2. apwsnovedades → lista de archivos + links.
 *  3. Descargar cada archivo, loguear (hash, tamaño) en berkley_sync_archivos.
 *  4. Parsear asegur, polizas2, movimi, rieaut, ramas, cobert.
 *  5. Upsert a clientes y pólizas con prima/suma/dominio/tipo/cobertura.
 *  6. Avanzar ultimaCorrida SOLO si todo el pipeline tuvo éxito (idempotente).
 */

import "server-only";
import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { loadBerkleyConfig } from "../../config";
import {
  parseDecimalGD,
  parseFechaAAAAMMDD,
  parseFixedWidth,
} from "../../fixed-width";
import type { Novedad, NovedadesRequest, NovedadesResult } from "../../types";
import { apwsnovedades, downloadFile } from "./client";
import {
  ASEGUR_LAYOUT,
  COBERT_LAYOUT,
  MOVIMI_LAYOUT,
  POLIZAS2_LAYOUT,
  RAMAS_LAYOUT,
  RIEAUT_LAYOUT,
  layoutKeyFromFilename,
} from "./layouts";

/** Archivos GD que sí parseamos a tablas de dominio. */
const PARSED_KEYS = new Set([
  "asegur",
  "polizas2",
  "movimi",
  "rieaut",
  "ramas",
  "cobert",
]);

/** Magic bytes de un ZIP (`PK\x03\x04`). */
function isZip(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
}

/**
 * Los archivos de novedades de Berkley (`GDxxxxxx.NNNN`) son ZIPs que contienen
 * los archivos lógicos (`asegur.txt`, `polizas2.txt`, etc.). Devuelve los
 * contenidos que nos interesan como pares [clave_layout, buffer].
 */
function extractParsedFiles(buf: Buffer, archivo: string): Array<[string, Buffer]> {
  if (isZip(buf)) {
    const entries = unzipSync(buf, {
      filter: (f) => PARSED_KEYS.has(layoutKeyFromFilename(f.name)),
    });
    return Object.entries(entries).map(([name, data]) => [
      layoutKeyFromFilename(name),
      Buffer.from(data),
    ]);
  }
  const key = layoutKeyFromFilename(archivo);
  return PARSED_KEYS.has(key) ? [[key, buf]] : [];
}

const OVERLAP_DAYS = 1;
const DEFAULT_BACKFILL_DAYS = 7;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function ddMMyyyy(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${date.getUTCFullYear()}`;
}

/** FechaDesde = max(ultimaCorrida-1, hoy-7). */
function computeFechaDesde(ultima: Date | null): Date {
  const hoy = new Date();
  const floor = addDays(hoy, -DEFAULT_BACKFILL_DAYS);
  if (!ultima) return floor;
  const overlap = addDays(ultima, -OVERLAP_DAYS);
  return overlap.getTime() > floor.getTime() ? overlap : floor;
}

function parseFechaFlexible(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

// ---------------------------------------------------------------------------
// Mapas de enriquecimiento construidos en memoria por corrida
// ---------------------------------------------------------------------------

type MovimiEntry = { premio: string | null; suplemento: string };
type RieautEntry = {
  suma_asegurada: string | null;
  dominio: string | null;
  codigo_cobertura: string | null;
};

/** Clave de póliza: rama + poliza (sin suplemento, para cruzar con polizas2). */
function polizaKey(rama: string, poliza: string): string {
  return `${rama.trim()}-${poliza.trim()}`;
}

/**
 * Construye un mapa { rama-poliza → movimi con mayor endoso }.
 * El movimiento de mayor endoso representa el estado actual de la póliza.
 */
function buildMovimiMap(buf: Buffer): Map<string, MovimiEntry> {
  const rows = parseFixedWidth(buf, MOVIMI_LAYOUT);
  const map = new Map<string, { endoso: number; premio: string | null; suplemento: string }>();
  for (const r of rows) {
    if (!r.rama || !r.poliza) continue;
    const key = polizaKey(r.rama, r.poliza);
    const endoso = Number(r.numero_endoso ?? 0) || 0;
    const existing = map.get(key);
    if (!existing || endoso > existing.endoso) {
      map.set(key, {
        endoso,
        premio: parseDecimalGD(r.premio ?? ""),
        // Normalizar "001" → "1", "000" → "0"
        suplemento: String(Number(String(r.suplemento ?? "").trim()) || 0),
      });
    }
  }
  // Convertir al tipo de retorno limpio.
  const result = new Map<string, MovimiEntry>();
  for (const [k, v] of map) {
    result.set(k, { premio: v.premio, suplemento: v.suplemento });
  }
  return result;
}

/**
 * Construye un mapa { rama-poliza → datos del vehículo }.
 * Solo considera riesgos activos (estado_riesgo = 'A').
 * Para flotas (múltiples riesgos) dominio queda null.
 */
function buildRieautMap(buf: Buffer): Map<string, RieautEntry> {
  const rows = parseFixedWidth(buf, RIEAUT_LAYOUT);
  const accumulator = new Map<
    string,
    { sumaTotal: number; patentes: string[]; cobertura: string | null }
  >();

  for (const r of rows) {
    if (!r.rama || !r.poliza) continue;
    // Solo riesgos activos.
    if (String(r.estado_riesgo ?? "").trim().toUpperCase() !== "A") continue;
    const key = polizaKey(r.rama, r.poliza);
    const valorNum = Number((r.valor_asegurado ?? "").trim()) || 0;
    const patente = String(r.patente ?? "").trim();
    const cobertura = String(r.codigo_cobertura ?? "").trim() || null;
    const entry = accumulator.get(key) ?? { sumaTotal: 0, patentes: [], cobertura: null };
    entry.sumaTotal += valorNum;
    if (patente) entry.patentes.push(patente);
    if (!entry.cobertura && cobertura) entry.cobertura = cobertura;
    accumulator.set(key, entry);
  }

  const result = new Map<string, RieautEntry>();
  for (const [k, v] of accumulator) {
    const sumaStr = v.sumaTotal > 0
      ? (v.sumaTotal / 100).toFixed(2)
      : null;
    // Dominio solo si hay un único vehículo; flotas quedan null.
    const dominio = v.patentes.length === 1 ? v.patentes[0] : null;
    result.set(k, {
      suma_asegurada: sumaStr,
      dominio,
      codigo_cobertura: v.cobertura,
    });
  }
  return result;
}

/** Mapa de rama (código) → descripción, construido desde ramas.txt. */
function buildRamasMap(buf: Buffer): Map<string, string> {
  const rows = parseFixedWidth(buf, RAMAS_LAYOUT);
  const map = new Map<string, string>();
  for (const r of rows) {
    const codigo = String(r.codigo ?? "").trim();
    const desc = String(r.descripcion ?? "").trim();
    if (codigo && desc) map.set(codigo, desc);
  }
  return map;
}

/** Mapa de código cobertura → descripción, construido desde cobert.txt. */
function buildCobertMap(buf: Buffer): Map<string, string> {
  const rows = parseFixedWidth(buf, COBERT_LAYOUT);
  const map = new Map<string, string>();
  for (const r of rows) {
    const codigo = String(r.codigo ?? "").trim();
    const desc = String(r.descripcion ?? "").trim();
    if (codigo && desc) map.set(codigo, desc);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Mapeo de rama → tipo de seguro (mapa estático de códigos conocidos)
// ---------------------------------------------------------------------------

/**
 * Códigos de rama Berkley conocidos → nombre canónico en tipos_seguro, categoría
 * y código de rama genérica. Los nombres deben coincidir con los del seed para no
 * crear duplicados. `rama` es el slug provider-agnostic (codigo de ramas_genericas)
 * con el que otras aseguradoras mapean su propio código interno al mismo tipo_seguro.
 */
const RAMA_A_TIPO: Record<
  string,
  { nombre: string; categoria: string; rama: string }
> = {
  "01": { nombre: "Accidentes del Trabajo",            categoria: "art",      rama: "accidentes_trabajo"            },
  "02": { nombre: "Cascos Embarcaciones",              categoria: "otros",    rama: "cascos_embarcaciones"          },
  "03": { nombre: "Responsabilidad Civil",             categoria: "otros",    rama: "responsabilidad_civil"         },
  "04": { nombre: "Automotores",                       categoria: "auto",     rama: "automotores"                   },
  "05": { nombre: "Cristales",                         categoria: "hogar",    rama: "cristales"                     },
  "06": { nombre: "Mercaderías",                       categoria: "comercio", rama: "mercaderias"                   },
  "07": { nombre: "Granizo",                           categoria: "agricola", rama: "granizo"                       },
  "08": { nombre: "Incendio",                          categoria: "hogar",    rama: "incendio"                      },
  "09": { nombre: "Accidentes Personales",             categoria: "otros",    rama: "accidentes_personales"         },
  "10": { nombre: "Riesgos del Trabajo",               categoria: "art",      rama: "riesgos_trabajo"               },
  "11": { nombre: "Robo",                              categoria: "otros",    rama: "robo"                          },
  "12": { nombre: "Riesgos Varios",                    categoria: "otros",    rama: "riesgos_varios"                },
  "13": { nombre: "Integral de Consorcio",             categoria: "comercio", rama: "integral_consorcio"            },
  "14": { nombre: "Caución",                           categoria: "otros",    rama: "caucion"                       },
  "15": { nombre: "Seguros Técnicos",                  categoria: "otros",    rama: "seguros_tecnicos"              },
  "16": { nombre: "Ganado",                            categoria: "agricola", rama: "ganado"                        },
  "17": { nombre: "Vida Colectivo",                    categoria: "vida",     rama: "vida_colectivo"                },
  "18": { nombre: "Combinado Familiar",                categoria: "vida",     rama: "combinado_familiar"            },
  "19": { nombre: "Vida Obligatorio",                  categoria: "vida",     rama: "vida_obligatorio"              },
  "20": { nombre: "Alta Complejidad Médica",           categoria: "salud",    rama: "alta_complejidad_medica"       },
  "21": { nombre: "Combinado Individual y Comercial",  categoria: "comercio", rama: "combinado_ind_com"             },
  "22": { nombre: "Vida Individual",                   categoria: "vida",     rama: "vida_individual"               },
  "23": { nombre: "Liability",                         categoria: "otros",    rama: "liability"                     },
  "24": { nombre: "Responsabilidad Civil Patronal",    categoria: "otros",    rama: "responsabilidad_civil_patronal" },
  "25": { nombre: "Motovehículos",                     categoria: "auto",     rama: "motovehiculos"                 },
};

/**
 * Resuelve (creando si hace falta) la rama genérica para un código Berkley.
 * Para ramas conocidas usa el slug curado de RAMA_A_TIPO; para una rama nueva
 * que Berkley agregue, crea la fila al vuelo con codigo `rama_NN` y la descripción
 * del archivo ramas.txt — sin migración. Un admin puede renombrarla/fusionarla luego.
 */
async function resolveRamaGenericaId(
  ramaCode: string,
  known: { nombre: string; rama: string } | undefined,
  descripcion: string | null,
): Promise<number> {
  const codigo = known?.rama ?? `rama_${ramaCode}`;
  const nombre = known?.nombre ?? descripcion ?? `Rama ${ramaCode}`;
  const row = await prisma.ramas_genericas.upsert({
    where: { codigo },
    create: { codigo, nombre, descripcion },
    update: {},
    select: { id: true },
  });
  return row.id;
}

/** Cache de tipo_seguro_id por nombre para un mismo run. */
const tipoSeguroCache = new Map<string, number>();

async function resolveTipoSeguroId(
  rama: string,
  ramasMap: Map<string, string>,
): Promise<number | null> {
  const ramaCode = rama.trim().padStart(2, "0");
  const known = RAMA_A_TIPO[ramaCode];
  const nombre = known?.nombre ?? `Rama ${ramaCode}`;
  const categoria = (known?.categoria ?? "otros") as
    | "auto" | "vida" | "hogar" | "salud" | "comercio" | "art" | "agricola" | "otros";

  if (tipoSeguroCache.has(nombre)) return tipoSeguroCache.get(nombre)!;

  // Usar descripción de ramas.txt cuando el código no está en el mapa estático.
  const descripcionFallback = ramasMap.get(ramaCode) ?? null;
  const ramaId = await resolveRamaGenericaId(ramaCode, known, descripcionFallback);
  const row = await prisma.tipos_seguro.upsert({
    where: { nombre },
    create: { nombre, categoria, rama_id: ramaId, descripcion: descripcionFallback },
    update: {},
    select: { id: true },
  });
  tipoSeguroCache.set(nombre, row.id);
  return row.id;
}

/** Normaliza un texto a un slug estable: minúsculas, sin acentos, `_` por separador. */
function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Cache de cobertura_generica_id por codigo para un mismo run. */
const coberturaGenericaCache = new Map<string, number>();

/**
 * Resuelve (creando si hace falta) la cobertura genérica para una cobertura
 * Berkley. La clave canónica es el slug de la descripción de cobert.txt, así dos
 * aseguradoras con el mismo nombre de cobertura mapean a la misma fila genérica.
 * No hay mapa estático de códigos Berkley: todas se crean al vuelo como dato.
 */
async function resolveCoberturaGenericaId(nombre: string): Promise<number> {
  const codigo = slugify(nombre) || "sin_clasificar";
  if (coberturaGenericaCache.has(codigo)) return coberturaGenericaCache.get(codigo)!;
  const row = await prisma.coberturas_genericas.upsert({
    where: { codigo },
    create: { codigo, nombre },
    update: {},
    select: { id: true },
  });
  coberturaGenericaCache.set(codigo, row.id);
  return row.id;
}

/** Cache de cobertura_id por "tipoId:nombre" para un mismo run. */
const coberturaCache = new Map<string, number>();

async function resolveCoberturaId(
  tipoSeguroId: number,
  codigoCobertura: string | null,
  cobertMap: Map<string, string>,
): Promise<number | null> {
  if (!codigoCobertura) return null;
  const codigo = codigoCobertura.trim();
  const nombre = cobertMap.get(codigo) ?? `Cobertura ${codigo}`;
  const cacheKey = `${tipoSeguroId}:${nombre}`;

  if (coberturaCache.has(cacheKey)) return coberturaCache.get(cacheKey)!;

  const coberturaGenericaId = await resolveCoberturaGenericaId(nombre);
  const row = await prisma.coberturas.upsert({
    where: { tipo_seguro_id_nombre: { tipo_seguro_id: tipoSeguroId, nombre } },
    create: { tipo_seguro_id: tipoSeguroId, nombre, cobertura_generica_id: coberturaGenericaId },
    update: {},
    select: { id: true },
  });
  coberturaCache.set(cacheKey, row.id);
  return row.id;
}

/** Inicio del día de hoy en UTC (ms). Polizas con fecha_fin < este valor están vencidas. */
function startOfTodayUTC(): number {
  const h = new Date();
  return Date.UTC(h.getUTCFullYear(), h.getUTCMonth(), h.getUTCDate());
}

/**
 * Resuelve (creando si hace falta) la cobertura "Sin especificar" para un
 * tipo_seguro dado. Se usa como fallback cuando Berkley no incluye cobertura
 * en rieaut para esa póliza.
 */
async function resolveCoberturaFallbackId(tipoSeguroId: number): Promise<number> {
  const nombre = "Sin especificar";
  const cacheKey = `${tipoSeguroId}:${nombre}`;
  if (coberturaCache.has(cacheKey)) return coberturaCache.get(cacheKey)!;
  const coberturaGenericaId = await resolveCoberturaGenericaId(nombre);
  const row = await prisma.coberturas.upsert({
    where: { tipo_seguro_id_nombre: { tipo_seguro_id: tipoSeguroId, nombre } },
    create: { tipo_seguro_id: tipoSeguroId, nombre, cobertura_generica_id: coberturaGenericaId },
    update: {},
    select: { id: true },
  });
  coberturaCache.set(cacheKey, row.id);
  return row.id;
}

// ---------------------------------------------------------------------------
// Punto de entrada principal
// ---------------------------------------------------------------------------

export async function runBerkleySync(
  req: NovedadesRequest = {},
): Promise<NovedadesResult> {
  // Limpiar caches de resolución para que el run sea idempotente.
  tipoSeguroCache.clear();
  coberturaCache.clear();
  coberturaGenericaCache.clear();

  const config = loadBerkleyConfig();
  const state = await prisma.berkley_sync_state.findUnique({ where: { id: 1 } });
  const fechaDesde = req.fechaDesde ?? computeFechaDesde(state?.ultima_corrida ?? null);

  const archivos = await apwsnovedades(config, ddMMyyyy(fechaDesde));

  const novedades: Novedad[] = [];
  let archivosDescargados = 0;

  for (const a of archivos) {
    if (!a.link) continue;
    const buf = await downloadFile(config, a.link);
    archivosDescargados++;

    await prisma.berkley_sync_archivos.create({
      data: {
        nombre: a.archivo,
        link: a.link,
        fecha_modificacion: parseFechaFlexible(a.fechaModificacion),
        hash: createHash("sha256").update(buf).digest("hex"),
        tamano_bytes: buf.length,
      },
    });

    const archivosInternos = extractParsedFiles(buf, a.archivo);

    // Construir mapas de enriquecimiento desde los archivos auxiliares.
    const movimiEntry = archivosInternos.find(([k]) => k === "movimi");
    const rieautEntry = archivosInternos.find(([k]) => k === "rieaut");
    const ramasEntry  = archivosInternos.find(([k]) => k === "ramas");
    const cobertEntry = archivosInternos.find(([k]) => k === "cobert");

    const movimiMap = movimiEntry ? buildMovimiMap(movimiEntry[1]) : new Map<string, MovimiEntry>();
    const rieautMap = rieautEntry ? buildRieautMap(rieautEntry[1]) : new Map<string, RieautEntry>();
    const ramasMap  = ramasEntry  ? buildRamasMap(ramasEntry[1])   : new Map<string, string>();
    const cobertMap = cobertEntry ? buildCobertMap(cobertEntry[1]) : new Map<string, string>();

    // Procesar clientes primero (para que polizas2 pueda linkearse por código).
    const asegurEntry = archivosInternos.find(([k]) => k === "asegur");
    const polizas2Entry = archivosInternos.find(([k]) => k === "polizas2");
    if (asegurEntry) await syncAsegur(asegurEntry[1], novedades);
    if (polizas2Entry) {
      await syncPolizas2(polizas2Entry[1], novedades, movimiMap, rieautMap, ramasMap, cobertMap);
    }
  }

  if (novedades.length > 0) {
    await prisma.berkley_novedades.createMany({
      data: novedades.map((n) => ({
        tipo: n.tipo,
        archivo: n.archivo,
        rama: n.rama,
        poliza: n.poliza,
        suplemento: n.suplemento,
        payload: n.payload as Prisma.InputJsonValue,
      })),
    });
  }

  // Eliminar pólizas Berkley que hayan vencido (cascadea a siniestros).
  await prisma.polizas.deleteMany({
    where: {
      aseguradora: { codigo_integracion: "berkley" },
      fecha_fin_vigencia: { lt: new Date(startOfTodayUTC()) },
    },
  });

  // Avanzar el estado solo si llegamos hasta acá sin excepciones.
  await prisma.berkley_sync_state.upsert({
    where: { id: 1 },
    create: { id: 1, ultima_corrida: new Date() },
    update: { ultima_corrida: new Date() },
  });

  return {
    archivosDescargados,
    novedadesDetectadas: novedades.length,
    novedades,
  };
}

// ---------------------------------------------------------------------------
// Sync de clientes (asegur)
// ---------------------------------------------------------------------------

/** DNI a usar para una persona: el documento real, o el código Berkley si viene
 * vacío/"0" (en asegur el documento suele ser "0"). El código es único en asegur. */
function dniDeAsegur(r: Record<string, string | null | undefined>): string {
  const doc = String(r.numero_documento ?? "").trim();
  return doc && doc !== "0" ? doc : String(r.codigo_asegurado ?? "").trim();
}

/** Compone la dirección a partir de calle, localidad y CP de asegur. Null si vacía. */
function direccionDeAsegur(r: Record<string, string | null | undefined>): string | null {
  const calle = String(r.calle ?? "").trim();
  const localidad = String(r.localidad ?? "").trim();
  const cp = String(r.codigo_postal ?? "").trim();
  const base = [calle, localidad].filter(Boolean).join(", ");
  const full = cp ? `${base}${base ? " " : ""}(CP ${cp})` : base;
  return full || null;
}

/** Busca un cliente ya existente por su documento (cuit o dni). */
async function findClienteByDoc(
  esCorporativo: boolean,
  r: Record<string, string | null | undefined>,
): Promise<number | null> {
  if (esCorporativo) {
    const cuit = String(r.cuit ?? "").trim();
    if (!cuit) return null;
    const corp = await prisma.clientes_corporativos.findUnique({
      where: { cuit },
      select: { cliente_id: true },
    });
    return corp?.cliente_id ?? null;
  }
  const dni = dniDeAsegur(r);
  if (!dni) return null;
  const nocorp = await prisma.clientes_no_corporativos.findUnique({
    where: { dni },
    select: { cliente_id: true },
  });
  return nocorp?.cliente_id ?? null;
}

function pushNovedadAsegur(
  novedades: Novedad[],
  r: Record<string, string | null | undefined>,
  error?: string,
): void {
  novedades.push({
    tipo: "alta",
    archivo: "asegur",
    rama: null,
    poliza: null,
    suplemento: null,
    payload: error ? { ...r, _error: error } : r,
    detectadaEn: new Date().toISOString(),
  });
}

async function syncAsegur(buf: Buffer, novedades: Novedad[]): Promise<void> {
  const rows = parseFixedWidth(buf, ASEGUR_LAYOUT);
  for (const r of rows) {
    const codigo = r.codigo_asegurado;
    if (!codigo) continue;

    // Corporativo si tiene CUIT válido (no vacío, no todo ceros).
    const cuit = String(r.cuit ?? "").trim();
    const tieneCuit = cuit.length > 0 && !/^0+$/.test(cuit);
    const esCorporativo = tieneCuit;

    const raw = r as unknown as Prisma.InputJsonValue;
    const email = r.email || null;
    const telefono = r.telefono || null;
    const direccion = direccionDeAsegur(r);

    // 1. ¿Ya vinculado por código Berkley? → actualizar campos básicos.
    const byCodigo = await prisma.clientes.findUnique({
      where: { codigo_asegurado_berkley: codigo },
      select: { id: true },
    });
    if (byCodigo) {
      await prisma.clientes.update({
        where: { id: byCodigo.id },
        data: { email, telefono, direccion, raw_berkley: raw },
      });
      continue;
    }

    // 2. ¿Existe un cliente con el mismo documento (cuit/dni)? → vincularlo.
    const existingId = await findClienteByDoc(esCorporativo, r);
    if (existingId) {
      try {
        await prisma.clientes.update({
          where: { id: existingId },
          data: { codigo_asegurado_berkley: codigo, email, telefono, direccion, raw_berkley: raw },
        });
      } catch {
        // El cliente ya tiene otro código Berkley (dos códigos con el mismo doc).
        pushNovedadAsegur(novedades, r, "doc_duplicado");
      }
      continue;
    }

    // 3. Alta nueva: cliente + sub-tabla en una sola operación atómica.
    try {
      await prisma.clientes.create({
        data: {
          tipo: esCorporativo ? "corporativo" : "persona",
          email,
          telefono,
          direccion,
          codigo_asegurado_berkley: codigo,
          raw_berkley: raw,
          fecha_alta: new Date(),
          ...(esCorporativo
            ? {
                clientes_corporativos: {
                  create: {
                    cuit,
                    razon_social: String(r.nombre ?? "").trim() || cuit,
                  },
                },
              }
            : {
                clientes_no_corporativos: {
                  create: {
                    dni: dniDeAsegur(r),
                    nombre: String(r.nombre ?? "").trim() || "Sin nombre",
                    apellido: "",
                  },
                },
              }),
        },
      });
      pushNovedadAsegur(novedades, r);
    } catch {
      pushNovedadAsegur(novedades, r, "no_creado");
    }
  }
}

// ---------------------------------------------------------------------------
// Sync de pólizas (polizas2 + enriquecimiento desde movimi/rieaut)
// ---------------------------------------------------------------------------

/** Resuelve (y cachea en el run) el ID de la aseguradora Berkley. */
async function getBerkleyAseguradoraId(): Promise<number | null> {
  const row = await prisma.empresas_aseguradoras.findFirst({
    where: { codigo_integracion: "berkley" },
    select: { id: true },
  });
  return row?.id ?? null;
}

async function syncPolizas2(
  buf: Buffer,
  novedades: Novedad[],
  movimiMap: Map<string, MovimiEntry>,
  rieautMap: Map<string, RieautEntry>,
  ramasMap: Map<string, string>,
  cobertMap: Map<string, string>,
): Promise<void> {
  const rows = parseFixedWidth(buf, POLIZAS2_LAYOUT);
  const aseguradoraId = await getBerkleyAseguradoraId();
  if (!aseguradoraId) {
    novedades.push({
      tipo: "alta",
      archivo: "polizas2",
      rama: null,
      poliza: null,
      suplemento: null,
      payload: { _error: "aseguradora_berkley_no_encontrada" },
      detectadaEn: new Date().toISOString(),
    });
    return;
  }

  for (const r of rows) {
    const rama = r.rama;
    const poliza = r.poliza;
    if (!rama || !poliza) continue;

    // Número de póliza: solo el número (el segmento entre guiones).
    // Rama y suplemento viven en columnas propias.
    const numeroPoliza = poliza.trim();

    // Descartar pólizas vencidas antes de cualquier escritura.
    const fechaFin = parseFechaAAAAMMDD(r.vig_final ?? "");
    if (fechaFin && fechaFin.getTime() < startOfTodayUTC()) continue;

    const existing = await prisma.polizas.findUnique({
      where: { numero_poliza: numeroPoliza },
      select: {
        id: true,
        raw_berkley: true,
        prima_mensual: true,
        suma_asegurada: true,
        dominio: true,
        cobertura_id: true,
      },
    });

    // Resolver cliente_id por codigo_asegurado_berkley.
    let clienteId: number | null = null;
    if (r.asegurado) {
      const cli = await prisma.clientes.findUnique({
        where: { codigo_asegurado_berkley: r.asegurado },
        select: { id: true },
      });
      clienteId = cli?.id ?? null;
    }

    // Estado: anulada si la poliza viene marcada; vigente en caso contrario.
    // (vigente/vencida/proxima se derivan en tiempo de lectura desde fecha_fin_vigencia)
    const estado: "vigente" | "anulada" =
      r.anulada?.toUpperCase() === "S" ? "anulada" : "vigente";

    // Datos de enriquecimiento desde los archivos complementarios.
    const key = polizaKey(rama, poliza);
    const movimi = movimiMap.get(key);
    const rieaut = rieautMap.get(key);

    // Suplemento vigente: del movimiento de mayor endoso; "0" si no viene en este ZIP.
    const suplemento = movimi?.suplemento ?? "0";

    const ramaCode = rama.trim().padStart(2, "0");
    const esRamaConDominio = RAMA_A_TIPO[ramaCode]?.categoria === "auto";

    const tipoSeguroId = await resolveTipoSeguroId(rama, ramasMap);
    // Toda póliza debe tener cobertura: si Berkley no manda código, usamos el fallback.
    const coberturaId = tipoSeguroId
      ? (rieaut?.codigo_cobertura
          ? await resolveCoberturaId(tipoSeguroId, rieaut.codigo_cobertura, cobertMap)
          : await resolveCoberturaFallbackId(tipoSeguroId))
      : null;

    const polizaData = {
      rama,
      suplemento,
      raw_berkley: r as unknown as Prisma.InputJsonValue,
      estado,
      fecha_inicio_vigencia: parseFechaAAAAMMDD(r.vig_inicial) ?? undefined,
      fecha_fin_vigencia:    parseFechaAAAAMMDD(r.vig_final)   ?? undefined,
      // Enriquecimiento — se setea si viene del archivo complementario, se deja
      // sin cambios (undefined) si no llegó en este ZIP para no sobrescribir datos
      // válidos de una corrida anterior.
      ...(movimi?.premio != null                       && { prima_mensual:  movimi.premio       }),
      ...(rieaut?.suma_asegurada                       && { suma_asegurada: rieaut.suma_asegurada }),
      // Dominio solo para ramas de la categoría "auto" (automotor, flota, etc.).
      ...(rieaut?.dominio && esRamaConDominio          && { dominio:        rieaut.dominio      }),
      ...(tipoSeguroId                                 && { tipo_seguro_id: tipoSeguroId        }),
      ...(coberturaId                                  && { cobertura_id:   coberturaId         }),
    };

    if (!existing) {
      if (!clienteId) {
        novedades.push({
          tipo: "alta",
          archivo: "polizas2",
          rama,
          poliza,
          suplemento,
          payload: { ...r, _error: "cliente_no_encontrado" },
          detectadaEn: new Date().toISOString(),
        });
        continue;
      }
      await prisma.polizas.create({
        data: {
          numero_poliza: numeroPoliza,
          cliente_id: clienteId,
          aseguradora_id: aseguradoraId,
          ...polizaData,
        },
      });
      novedades.push({
        tipo: "alta",
        archivo: "polizas2",
        rama,
        poliza,
        suplemento,
        payload: r,
        detectadaEn: new Date().toISOString(),
      });
    } else {
      // Actualizar si: el raw de polizas2 cambió O si la póliza existente aún le
      // faltan datos de enriquecimiento (backfill de corridas anteriores incompletas).
      const rawAnterior = JSON.stringify(existing.raw_berkley);
      const rawNuevo    = JSON.stringify(r);
      const needsEnrich =
        (existing.prima_mensual == null && movimi?.premio != null) ||
        (existing.suma_asegurada == null && rieaut?.suma_asegurada != null) ||
        (existing.dominio == null && rieaut?.dominio != null && esRamaConDominio) ||
        (existing.cobertura_id == null && coberturaId != null);

      if (rawAnterior !== rawNuevo || needsEnrich) {
        await prisma.polizas.update({
          where: { id: existing.id },
          data: polizaData,
        });
        novedades.push({
          tipo: "cambio",
          archivo: "polizas2",
          rama,
          poliza,
          suplemento,
          payload: r,
          detectadaEn: new Date().toISOString(),
        });
      }
    }
  }
}
