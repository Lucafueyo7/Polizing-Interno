import { describe, it, expect, vi, afterEach } from "vitest";
import {
  blockText,
  buildSoapEnvelope,
  soapBlocks,
  soapCall,
  soapText,
} from "../soap";
import { InsurerError } from "../errors";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetchOnce(body: string, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body, { status })),
  );
}

describe("buildSoapEnvelope", () => {
  it("incluye los campos definidos y omite los undefined", () => {
    const xml = buildSoapEnvelope("apwsnovedades", {
      Usuario: "u",
      Password: "p",
      FechaDesde: "01/01/2026",
      Riesgo: undefined,
    });
    expect(xml).toContain("<ws:apwsnovedades>");
    expect(xml).toContain("<Usuario>u</Usuario>");
    expect(xml).toContain("<FechaDesde>01/01/2026</FechaDesde>");
    expect(xml).not.toContain("Riesgo");
  });

  it("escapa caracteres XML en los valores", () => {
    const xml = buildSoapEnvelope("m", { V: "a&b<c" });
    expect(xml).toContain("<V>a&amp;b&lt;c</V>");
  });
});

const NOVEDADES_RESPONSE = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:ws="http://webservices.binet17.com/">
  <soapenv:Body>
    <ws:apwsnovedadesResponse>
      <ErrorCodigo>0</ErrorCodigo>
      <ErrorDescripcion></ErrorDescripcion>
      <Archivos>
        <Archivo>Polizas2.txt</Archivo>
        <FechaUltimaModificacion>2026-01-15</FechaUltimaModificacion>
        <Link>https://ws.berkley.com.ar/descargas/Polizas2.txt</Link>
      </Archivos>
      <Archivos>
        <Archivo>movimi.txt</Archivo>
        <FechaUltimaModificacion>2026-01-15</FechaUltimaModificacion>
        <Link>https://ws.berkley.com.ar/descargas/movimi.txt</Link>
      </Archivos>
    </ws:apwsnovedadesResponse>
  </soapenv:Body>
</soapenv:Envelope>`;

describe("soapCall + parsers", () => {
  it("parsea bloques repetidos y campos por nombre local", async () => {
    mockFetchOnce(NOVEDADES_RESPONSE);
    const $ = await soapCall({
      url: "https://x",
      method: "apwsnovedades",
      fields: {},
    });
    expect(soapText($, "ErrorCodigo")).toBe("0");

    const archivos = soapBlocks($, "Archivos");
    expect(archivos).toHaveLength(2);
    expect(blockText($, archivos[0], "Archivo")).toBe("Polizas2.txt");
    expect(blockText($, archivos[0], "Link")).toContain("Polizas2.txt");
    expect(blockText($, archivos[1], "Archivo")).toBe("movimi.txt");
  });

  it("lanza InsurerError ante un SOAP Fault", async () => {
    const fault = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Body>
        <soapenv:Fault>
          <faultcode>soapenv:Server</faultcode>
          <faultstring>Usuario o password inválidos</faultstring>
        </soapenv:Fault>
      </soapenv:Body>
    </soapenv:Envelope>`;
    mockFetchOnce(fault, 500);
    await expect(
      soapCall({ url: "https://x", method: "apwsnovedades", fields: {} }),
    ).rejects.toBeInstanceOf(InsurerError);
  });
});
