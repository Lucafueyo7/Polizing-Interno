/**
 * Cliente REST de bajo nivel para Federación Patronal. Inyecta el Bearer token,
 * refresca una vez ante 401 y devuelve el JSON crudo. Los endpoints cuelgan de
 * `/v1` (el token, en cambio, de `/oauth/token`). Ver doc FedPat.
 */

import "server-only";
import type { FedPatConfig } from "../../config";
import { httpFetch } from "../../http";
import { getAccessToken } from "./auth";
import { InsurerBusinessError, InsurerError } from "../../errors";

const PROVIDER = "federacion_patronal";

/** Respuesta de los endpoints de reporte (póliza, certificado de cobertura, etc.). */
export type ReporteResponse = {
  nombreReporte?: string;
  desFormat?: string;
  reporte?: string[];
};

async function authedGet(
  config: FedPatConfig,
  path: string,
): Promise<Response> {
  const url = `${config.baseUrl}${path}`;
  let token = await getAccessToken(config);
  let res = await httpFetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    provider: PROVIDER,
  });
  if (res.status === 401) {
    token = await getAccessToken(config, true);
    res = await httpFetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      provider: PROVIDER,
    });
  }
  return res;
}

async function getJson<T>(config: FedPatConfig, path: string): Promise<T> {
  const res = await authedGet(config, path);
  if (!res.ok) {
    const detail = await safeText(res);
    throw new InsurerError(`Federación Patronal respondió ${res.status}`, {
      provider: PROVIDER,
      status: res.status,
      detail,
    });
  }
  return (await res.json()) as T;
}

async function safeText(res: Response): Promise<string | undefined> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return undefined;
  }
}

export type PolizaPathParams = {
  sucursal: number;
  ramo: number;
  poliza: number;
  certificado: number;
  endoso?: number;
};

function polizaBase(p: PolizaPathParams): string {
  return `/v1/poliza/${p.sucursal}/${p.ramo}/${p.poliza}/${p.certificado}`;
}

export function getReportePoliza(
  config: FedPatConfig,
  p: PolizaPathParams,
): Promise<ReporteResponse> {
  const endoso = p.endoso !== undefined ? `/${p.endoso}` : "";
  return getJson(config, `${polizaBase(p)}${endoso}/reporte/poliza`);
}

export function getCertificadoCobertura(
  config: FedPatConfig,
  p: PolizaPathParams,
): Promise<ReporteResponse> {
  return getJson(config, `${polizaBase(p)}/reporte/certificado-cobertura`);
}

export function getTarjetaSeguroObligatorio(
  config: FedPatConfig,
  p: PolizaPathParams,
): Promise<ReporteResponse> {
  return getJson(config, `${polizaBase(p)}/reporte/tarjeta-seguro-obligatorio`);
}

/** Tarjeta de circulación: devuelve un link de descarga. */
export async function getTarjetaCirculacionLink(
  config: FedPatConfig,
  numDocumento: string,
  patente: string,
): Promise<string> {
  const json = await getJson<{ response?: string }>(
    config,
    `/v1/utiles/reportes/link/${encodeURIComponent(numDocumento)}/${encodeURIComponent(patente)}`,
  );
  if (!json.response) {
    throw new InsurerBusinessError("No se obtuvo el link de la tarjeta de circulación", {
      provider: PROVIDER,
    });
  }
  return json.response;
}

export type CarteraClientesResponse = {
  fecha_solicitada?: string;
  fecha_solicitud?: string;
  clientes?: Array<Record<string, unknown>>;
};

/** Listado de clientes de la cartera. `fecha` en formato dd/MM/yyyy. */
export function getCarteraClientes(
  config: FedPatConfig,
  fecha: string,
  tipo: string,
): Promise<CarteraClientesResponse> {
  const qs = new URLSearchParams({ fecha, tipo });
  return getJson(config, `/v1/cartera/clientes?${qs.toString()}`);
}

/** Indica si un documento (DNI/CUIT) tiene pólizas vigentes. */
export async function getClienteActivo(
  config: FedPatConfig,
  numDocumento: string,
): Promise<boolean> {
  const json = await getJson<Array<{ resultado?: boolean }> | { resultado?: boolean }>(
    config,
    `/v1/clientes/cliente/${encodeURIComponent(numDocumento)}/activo`,
  );
  const first = Array.isArray(json) ? json[0] : json;
  return Boolean(first?.resultado);
}
