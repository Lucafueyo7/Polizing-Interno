/**
 * Orquestación del sync diario de Berkley (iteración 1: infra + detección).
 *
 * Patrón "diario incremental" del manual §2.8 / §6.1:
 *  1. FechaDesde = max(ultimaCorrida-1, hoy-7) (overlap de seguridad).
 *  2. apwsnovedades → lista de archivos + links.
 *  3. Descargar cada archivo, loguear (hash, tamaño) en berkley_sync_archivos.
 *  4. Parsear los archivos clave; detectar altas/cambios (berkley_novedades) y
 *     persistir la cartera local (berkley_cartera_*).
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
    const existing = await prisma.berkley_cartera_clientes.findUnique({
      where: { codigo_asegurado: codigo },
    });
    const data = {
      nombre: r.nombre || null,
      cuit: r.cuit || null,
      numero_documento: r.numero_documento || null,
      telefono: r.telefono || null,
      raw: r,
    };
    await prisma.berkley_cartera_clientes.upsert({
      where: { codigo_asegurado: codigo },
      create: { codigo_asegurado: codigo, ...data },
      update: data,
    });
    if (!existing) {
      novedades.push({
        tipo: "alta",
        archivo: "asegur",
        rama: null,
        poliza: null,
        suplemento: null,
        payload: r,
        detectadaEn: new Date().toISOString(),
      });
    }
  }
}

async function syncPolizas2(buf: Buffer, novedades: Novedad[]): Promise<void> {
  const rows = parseFixedWidth(buf, POLIZAS2_LAYOUT);
  for (const r of rows) {
    const rama = r.rama;
    const poliza = r.poliza;
    const suplemento = "0"; // Polizas2 no trae suplemento; el alta original es 0.
    if (!rama || !poliza) continue;

    const existing = await prisma.berkley_cartera_polizas.findUnique({
      where: { rama_poliza_suplemento: { rama, poliza, suplemento } },
    });
    const data = {
      codigo_asegurado: r.asegurado || null,
      vigencia_inicio: parseFechaAAAAMMDD(r.vig_inicial),
      vigencia_fin: parseFechaAAAAMMDD(r.vig_final),
      anulada: r.anulada?.toUpperCase() === "S",
      raw: r,
    };
    await prisma.berkley_cartera_polizas.upsert({
      where: { rama_poliza_suplemento: { rama, poliza, suplemento } },
      create: { rama, poliza, suplemento, ...data },
      update: data,
    });

    if (!existing) {
      novedades.push({
        tipo: "alta",
        archivo: "polizas2",
        rama,
        poliza,
        suplemento,
        payload: r,
        detectadaEn: new Date().toISOString(),
      });
    } else if (JSON.stringify(existing.raw) !== JSON.stringify(r)) {
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
