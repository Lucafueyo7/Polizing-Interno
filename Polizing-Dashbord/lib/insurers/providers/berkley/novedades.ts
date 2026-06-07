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

    const key = layoutKeyFromFilename(a.archivo);
    if (key === "asegur") await syncAsegur(buf, novedades);
    else if (key === "polizas2") await syncPolizas2(buf, novedades);
    // movimi/cdp/pagos: descargados y logueados; parseo disponible vía layouts,
    // sin convertir a novedades en esta iteración.
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

async function syncAsegur(buf: Buffer, novedades: Novedad[]): Promise<void> {
  const rows = parseFixedWidth(buf, ASEGUR_LAYOUT);
  for (const r of rows) {
    const codigo = r.codigo_asegurado;
    if (!codigo) continue;

    // ¿Ya existe un cliente vinculado a este código Berkley?
    const existing = await prisma.clientes.findUnique({
      where: { codigo_asegurado_berkley: codigo },
      select: { id: true },
    });

    // Heurística de tipo: si tiene CUIT → corporativo; si no → persona.
    const esCorporativo = !!(r.cuit && String(r.cuit).trim());
    const tipo: "corporativo" | "persona" = esCorporativo ? "corporativo" : "persona";

    const clienteBase = {
      tipo,
      email: r.email || null,
      telefono: r.telefono || null,
      codigo_asegurado_berkley: codigo,
      raw_berkley: r as unknown as Prisma.InputJsonValue,
    };

    if (!existing) {
      // Alta: crear cliente + sub-tabla.
      try {
        const nuevo = await prisma.clientes.create({
          data: {
            ...clienteBase,
            fecha_alta: new Date(),
          },
          select: { id: true },
        });
        await upsertSubtable(nuevo.id, esCorporativo, r);
      } catch {
        // Puede haber colisión en cuit/dni únicos (cliente que ya existía sin código Berkley).
        // En ese caso, intentamos vincular al existente por cuit o documento.
        const vinculado = await vincularClienteExistente(codigo, esCorporativo, r);
        if (!vinculado) {
          // No se pudo vincular: registrar como novedad para revisión manual.
          novedades.push({
            tipo: "alta",
            archivo: "asegur",
            rama: null,
            poliza: null,
            suplemento: null,
            payload: { ...r, _error: "no_vinculado" },
            detectadaEn: new Date().toISOString(),
          });
          continue;
        }
      }
      novedades.push({
        tipo: "alta",
        archivo: "asegur",
        rama: null,
        poliza: null,
        suplemento: null,
        payload: r,
        detectadaEn: new Date().toISOString(),
      });
    } else {
      // Actualización: sync campos básicos + raw_berkley.
      await prisma.clientes.update({
        where: { id: existing.id },
        data: {
          email: clienteBase.email,
          telefono: clienteBase.telefono,
          raw_berkley: clienteBase.raw_berkley,
        },
      });
    }
  }
}

/** Intenta vincular un cliente ya existente (por cuit/dni) al código Berkley. */
async function vincularClienteExistente(
  codigo: string,
  esCorporativo: boolean,
  r: Record<string, string | null | undefined>,
): Promise<boolean> {
  let clienteId: number | null = null;

  if (esCorporativo && r.cuit) {
    const corp = await prisma.clientes_corporativos.findUnique({
      where: { cuit: String(r.cuit) },
      select: { cliente_id: true },
    });
    if (corp) clienteId = corp.cliente_id;
  } else if (!esCorporativo && r.numero_documento) {
    const nocorp = await prisma.clientes_no_corporativos.findUnique({
      where: { dni: String(r.numero_documento) },
      select: { cliente_id: true },
    });
    if (nocorp) clienteId = nocorp.cliente_id;
  }

  if (!clienteId) return false;

  await prisma.clientes.update({
    where: { id: clienteId },
    data: {
      codigo_asegurado_berkley: codigo,
      raw_berkley: r as unknown as Prisma.InputJsonValue,
    },
  });
  return true;
}

/** Crea o actualiza la sub-tabla corporativo/persona para el cliente de Berkley. */
async function upsertSubtable(
  clienteId: number,
  esCorporativo: boolean,
  r: Record<string, string | null | undefined>,
): Promise<void> {
  if (esCorporativo) {
    const cuit = String(r.cuit ?? "").trim();
    const razonSocial = String(r.nombre ?? "").trim() || cuit;
    if (!cuit) return;
    await prisma.clientes_corporativos.upsert({
      where: { cliente_id: clienteId },
      create: { cliente_id: clienteId, cuit, razon_social: razonSocial },
      update: { cuit, razon_social: razonSocial },
    });
  } else {
    const dni = String(r.numero_documento ?? r.codigo_asegurado ?? "").trim();
    const nombre = String(r.nombre ?? "").trim() || "Sin nombre";
    if (!dni) return;
    await prisma.clientes_no_corporativos.upsert({
      where: { cliente_id: clienteId },
      create: { cliente_id: clienteId, dni, nombre, apellido: "" },
      update: { dni, nombre },
    });
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
