/**
 * Orquestación del sync diario de Berkley (iteración 1: infra + detección).
 *
 * Patrón "diario incremental" del manual §2.8 / §6.1:
 *  1. FechaDesde = max(ultimaCorrida-1, hoy-7) (overlap de seguridad).
 *  2. apwsnovedades → lista de archivos + links.
 *  3. Descargar cada archivo, loguear (hash, tamaño) en berkley_sync_archivos.
 *  4. Parsear los archivos clave; detectar altas/cambios (berkley_novedades) y
 *     hacer upsert a las tablas de dominio (clientes / polizas).
 *  5. Avanzar ultimaCorrida SOLO si todo el pipeline tuvo éxito (idempotente).
 *
 * No hace upsert a las tablas de dominio (polizas/clientes): eso queda para una
 * iteración posterior.
 */

import "server-only";
import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { loadBerkleyConfig } from "../../config";
import { parseFechaAAAAMMDD, parseFixedWidth } from "../../fixed-width";
import type { Novedad, NovedadesRequest, NovedadesResult } from "../../types";
import { apwsnovedades, downloadFile } from "./client";
import {
  ASEGUR_LAYOUT,
  POLIZAS2_LAYOUT,
  layoutKeyFromFilename,
} from "./layouts";

/** Archivos GD que sí parseamos a tablas de dominio. */
const PARSED_KEYS = new Set(["asegur", "polizas2"]);

/** Magic bytes de un ZIP (`PK\x03\x04`). */
function isZip(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
}

/**
 * Los archivos de novedades de Berkley (`GDxxxxxx.NNNN`) son ZIPs que contienen
 * los archivos lógicos (`asegur.txt`, `polizas2.txt`, etc.). Devuelve los
 * contenidos que nos interesan como pares [clave_layout, buffer]. Si el archivo
 * no es un ZIP, se trata como archivo único con su propio nombre.
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

export async function runBerkleySync(
  req: NovedadesRequest = {},
): Promise<NovedadesResult> {
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

    // El GD es un ZIP: extraemos los archivos lógicos que parseamos a dominio.
    // Primero asegur (crea clientes), luego polizas2 (linkea por codigo_asegurado).
    const archivosInternos = extractParsedFiles(buf, a.archivo);
    const asegur = archivosInternos.find(([k]) => k === "asegur");
    const polizas2 = archivosInternos.find(([k]) => k === "polizas2");
    if (asegur) await syncAsegur(asegur[1], novedades);
    if (polizas2) await syncPolizas2(polizas2[1], novedades);
    // movimi/cdp/pagos y demás: quedan dentro del ZIP, sin parsear en esta iteración.
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

    const esCorporativo = !!(r.cuit && String(r.cuit).trim());
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
                    cuit: String(r.cuit).trim(),
                    razon_social: String(r.nombre ?? "").trim() || String(r.cuit).trim(),
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

/** Resuelve (y cachea en el run) el ID de la aseguradora Berkley. */
async function getBerkleyAseguradoraId(): Promise<number | null> {
  const row = await prisma.empresas_aseguradoras.findFirst({
    where: { codigo_integracion: "berkley" },
    select: { id: true },
  });
  return row?.id ?? null;
}

async function syncPolizas2(buf: Buffer, novedades: Novedad[]): Promise<void> {
  const rows = parseFixedWidth(buf, POLIZAS2_LAYOUT);
  const aseguradoraId = await getBerkleyAseguradoraId();
  if (!aseguradoraId) {
    // Sin aseguradora Berkley configurada en la BD, no se pueden insertar pólizas.
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
    const suplemento = "0"; // Polizas2 no trae suplemento; el alta original es 0.
    if (!rama || !poliza) continue;

    const numeroPoliza = `${rama}-${poliza}-${suplemento}`;
    const existing = await prisma.polizas.findUnique({
      where: { numero_poliza: numeroPoliza },
      select: { id: true, raw_berkley: true },
    });

    // Resolver cliente_id por codigo_asegurado_berkley (puede ser null si no synced aún).
    let clienteId: number | null = null;
    if (r.asegurado) {
      const cli = await prisma.clientes.findUnique({
        where: { codigo_asegurado_berkley: r.asegurado },
        select: { id: true },
      });
      clienteId = cli?.id ?? null;
    }

    const estado: "vigente" | "anulada" = r.anulada?.toUpperCase() === "S" ? "anulada" : "vigente";
    const polizaData = {
      rama,
      suplemento,
      raw_berkley: r as unknown as Prisma.InputJsonValue,
      estado,
      fecha_inicio_vigencia: parseFechaAAAAMMDD(r.vig_inicial) ?? undefined,
      fecha_fin_vigencia: parseFechaAAAAMMDD(r.vig_final) ?? undefined,
    };

    if (!existing) {
      if (!clienteId) {
        // Sin cliente match: registrar novedad para revisión manual y continuar.
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
      // Alta de póliza parcial (tipo/cobertura/suma/prima quedan null hasta completarse a mano).
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
      // Actualización: solo campos que la cartera provee.
      const rawAnterior = JSON.stringify(existing.raw_berkley);
      const rawNuevo = JSON.stringify(r);
      if (rawAnterior !== rawNuevo) {
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
