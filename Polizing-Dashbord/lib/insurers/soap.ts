/**
 * Helpers SOAP genéricos (sin dependencias nuevas: usa `cheerio`, ya instalado).
 *
 * Arma el envelope a mano, hace POST con las cabeceras que esperan los servidores
 * Apache Axis (`Content-Type: text/xml`, `SOAPAction`), parsea la respuesta con
 * cheerio en modo XML y detecta los tres niveles de error descritos en el manual
 * de Berkley: HTTP no-200 → `soapenv:Fault` → códigos de negocio en el cuerpo.
 */

import * as cheerio from "cheerio";
import type { CheerioAPI, Cheerio } from "cheerio";
import type { Element } from "domhandler";
import { httpFetch } from "./http";
import { InsurerError } from "./errors";

/** Namespace placeholder; coincide con el de los ejemplos del manual Berkley. */
export const DEFAULT_SOAP_NAMESPACE = "http://webservices.binet17.com/";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Valor de un campo SOAP: escalar, objeto anidado (ej. el wrapper `Entrada` de
 * GeneXus) o lista de objetos repetidos (ej. la colección `RiesgoCol`).
 */
export type SoapFieldValue =
  | string
  | number
  | undefined
  | SoapFields
  | SoapFields[];
export type SoapFields = { [key: string]: SoapFieldValue };

/**
 * Renderiza los campos recursivamente. Los `undefined` se omiten (ej. `Riesgo`
 * no se envía en pólizas individuales); los objetos se anidan y los arrays
 * repiten el tag. El orden de inserción se respeta.
 */
function renderFields(fields: SoapFields, indent: string): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        const inner = renderFields(item, indent + "  ");
        lines.push(`${indent}<${key}>\n${inner}\n${indent}</${key}>`);
      }
    } else if (typeof value === "object") {
      const inner = renderFields(value, indent + "  ");
      lines.push(
        inner
          ? `${indent}<${key}>\n${inner}\n${indent}</${key}>`
          : `${indent}<${key}/>`,
      );
    } else {
      lines.push(`${indent}<${key}>${escapeXml(String(value))}</${key}>`);
    }
  }
  return lines.join("\n");
}

/**
 * Construye un envelope SOAP document/literal. El namespace se declara como
 * namespace por defecto en el elemento del método, de modo que los hijos quedan
 * calificados (necesario para servicios con `elementFormDefault="qualified"`,
 * como los GeneXus de Berkley).
 */
export function buildSoapEnvelope(
  method: string,
  fields: SoapFields,
  namespace: string = DEFAULT_SOAP_NAMESPACE,
): string {
  const body = renderFields(fields, "      ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header/>
  <soapenv:Body>
    <${method} xmlns="${namespace}">
${body}
    </${method}>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/** Nombre local de un tag, ignorando el prefijo de namespace (`soapenv:Fault` → `Fault`). */
function localName(el: Element): string {
  const name = el.tagName ?? el.name ?? "";
  return name.includes(":") ? name.split(":").pop()! : name;
}

/** Primer elemento cuyo nombre local coincide (case-insensitive). */
function findFirst($: CheerioAPI, name: string): Cheerio<Element> | null {
  const match = $("*")
    .filter((_, el) => localName(el as Element).toLowerCase() === name.toLowerCase())
    .first();
  return match.length ? (match as Cheerio<Element>) : null;
}

/** Texto del primer elemento con ese nombre local, o "" si no existe. */
export function soapText($: CheerioAPI, name: string): string {
  return findFirst($, name)?.text().trim() ?? "";
}

/** Todos los bloques repetidos con ese nombre local (ej. `Archivos`, `Documentos`). */
export function soapBlocks($: CheerioAPI, name: string): Cheerio<Element>[] {
  const out: Cheerio<Element>[] = [];
  $("*").each((_, el) => {
    if (localName(el as Element).toLowerCase() === name.toLowerCase()) {
      out.push($(el) as Cheerio<Element>);
    }
  });
  return out;
}

/** Texto de un hijo (por nombre local) dentro de un bloque. */
export function blockText(
  $: CheerioAPI,
  block: Cheerio<Element>,
  name: string,
): string {
  let found = "";
  block
    .find("*")
    .filter((_, el) => localName(el as Element).toLowerCase() === name.toLowerCase())
    .first()
    .each((_, el) => {
      found = $(el).text().trim();
    });
  return found;
}

export type SoapCallParams = {
  url: string;
  method: string;
  fields: SoapFields;
  namespace?: string;
  soapAction?: string;
  timeoutMs?: number;
  provider?: string;
};

/**
 * Ejecuta una llamada SOAP y devuelve el documento parseado. Lanza `InsurerError`
 * ante HTTP no-200 o si la respuesta contiene un `soapenv:Fault`. Los errores de
 * negocio (`ErrorCodigo` ≠ 0) los chequea cada adapter según su contrato.
 */
export async function soapCall(params: SoapCallParams): Promise<CheerioAPI> {
  const {
    url,
    method,
    fields,
    namespace = DEFAULT_SOAP_NAMESPACE,
    soapAction = "",
    timeoutMs = 60_000,
    provider,
  } = params;

  const envelope = buildSoapEnvelope(method, fields, namespace);
  const res = await httpFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: `"${soapAction}"`,
    },
    body: envelope,
    timeoutMs,
    provider,
  });

  const text = await res.text();

  if (!res.ok && !text.toLowerCase().includes("fault")) {
    throw new InsurerError(`El servicio SOAP respondió ${res.status}`, {
      provider,
      status: res.status,
      detail: text.slice(0, 500),
    });
  }

  const $ = cheerio.load(text, { xmlMode: true });

  const fault = findFirst($, "Fault");
  if (fault) {
    const faultString = blockText($, fault, "faultstring") || "SOAP Fault";
    throw new InsurerError(`SOAP Fault: ${faultString}`, {
      provider,
      status: res.status,
      detail: faultString,
    });
  }

  return $;
}
