/**
 * Cliente SOAP de bajo nivel para Berkley (apwsnovedades y awsmobimp_v2) más la
 * descarga de archivos por link. Maneja los tres niveles de error del manual:
 * el helper `soapCall` cubre HTTP + SOAP Fault; acá chequeamos `ErrorCodigo` /
 * `ErrorGeneralCodigo` de negocio.
 */

import "server-only";
import type { BerkleyConfig } from "../../config";
import { httpFetch } from "../../http";
import { soapBlocks, soapCall, soapText, blockText } from "../../soap";
import { InsurerBusinessError } from "../../errors";

const PROVIDER = "berkley";

/**
 * Los WS de Berkley son GeneXus: namespace `BINet_17`, método `<Objeto>.Execute`
 * y SOAPAction `BINet_17action/webservices.<OBJETO>.Execute`. Los parámetros van
 * envueltos en un SDT (`Sdt_wsnovedadesin` / `Entrada`). Verificado contra el WSDL
 * (`?wsdl`) de cada endpoint.
 */
const NAMESPACE = "BINet_17";

export type NovedadArchivo = {
  archivo: string;
  fechaModificacion: string;
  link: string;
};

export async function apwsnovedades(
  config: BerkleyConfig,
  fechaDesde: string,
): Promise<NovedadArchivo[]> {
  const $ = await soapCall({
    url: config.novedadesUrl,
    method: "PWSNovedades.Execute",
    namespace: NAMESPACE,
    soapAction: "BINet_17action/webservices.APWSNOVEDADES.Execute",
    fields: {
      Sdt_wsnovedadesin: {
        Usuario: config.usuario,
        Password: config.passwordNovedades,
        FechaDesde: fechaDesde,
      },
    },
    provider: PROVIDER,
  });

  const errorCodigo = soapText($, "ErrorCodigo");
  if (errorCodigo && errorCodigo !== "0") {
    throw new InsurerBusinessError(
      soapText($, "ErrorDescripcion") || "Error de negocio en apwsnovedades",
      { provider: PROVIDER, code: errorCodigo },
    );
  }

  return soapBlocks($, "ArchivosItem").map((block) => ({
    archivo: blockText($, block, "Archivo"),
    fechaModificacion: blockText($, block, "FechaUltimaModificacion"),
    link: blockText($, block, "Link"),
  }));
}

export type WsmobimpFlags = {
  CopiaPoliza: "S" | "N";
  CertificadoCobertura: "S" | "N";
  CertificadoMercosur: "S" | "N";
  ConstanciaPago: "S" | "N";
  Cuponera: "S" | "N";
  ImprimeSolicitud: "S" | "N";
  TarjetaCirculacion: "S" | "N";
  SeguroObligAut: "S" | "N";
  EnviaMail: "S" | "N";
};

export type WsmobimpParams = {
  rama: number;
  poliza?: number;
  endoso: number;
  riesgo?: number;
  solicitud?: number;
  empresa?: number;
  flags: WsmobimpFlags;
};

export type WsmobimpDocumento = {
  errorCodigo: string;
  errorDescripcion: string;
  nombre: string;
  link: string;
};

export async function awsmobimp(
  config: BerkleyConfig,
  params: WsmobimpParams,
): Promise<WsmobimpDocumento[]> {
  const $ = await soapCall({
    url: config.wsmobimpUrl,
    method: "WSMOBImp_v2.Execute",
    namespace: NAMESPACE,
    soapAction: "BINet_17action/webservices.AWSMOBIMP_V2.Execute",
    fields: {
      Entrada: {
        Usuario: config.usuario,
        Key: config.keyWsmobimp,
        Empresa: params.empresa ?? 0,
        Rama: params.rama,
        Poliza: params.poliza,
        Endoso: params.endoso,
        Riesgo: params.riesgo,
        Solicitud: params.solicitud,
        ...params.flags,
        // Colección opcional de riesgos (vacía: usamos el campo `Riesgo` simple).
        Riesgos: {},
      },
    },
    provider: PROVIDER,
  });

  const errorGeneral = soapText($, "ErrorGeneralCodigo");
  if (errorGeneral && errorGeneral !== "0") {
    throw new InsurerBusinessError(
      soapText($, "ErrorGeneralDescripcion") || "Error general en awsmobimp_v2",
      { provider: PROVIDER, code: errorGeneral },
    );
  }

  return soapBlocks($, "ImpresionItem").map((block) => ({
    errorCodigo: blockText($, block, "ErrorCodigo"),
    errorDescripcion: blockText($, block, "ErrorDescripcion"),
    nombre: blockText($, block, "ImpresionNombre"),
    link: blockText($, block, "Impresion"),
  }));
}

/**
 * Descarga un archivo (GD o PDF) por link. Por la naturaleza del servicio se
 * asume Basic Auth con las mismas credenciales de Novedades (confirmar con
 * Berkley). Devuelve el buffer crudo (los GD se decodifican luego como latin1).
 */
export async function downloadFile(
  config: BerkleyConfig,
  url: string,
): Promise<Buffer> {
  const basic = Buffer.from(
    `${config.usuario}:${config.passwordNovedades}`,
  ).toString("base64");
  const res = await httpFetch(url, {
    headers: { Authorization: `Basic ${basic}` },
    provider: PROVIDER,
  });
  if (!res.ok) {
    throw new InsurerBusinessError(`No se pudo descargar el archivo (${res.status})`, {
      provider: PROVIDER,
      status: res.status,
      detail: url,
    });
  }
  return Buffer.from(await res.arrayBuffer());
}
