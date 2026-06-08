/**
 * Test directo al SOAP de Berkley (awsmobimp_v2) para tarjeta de circulación.
 * Uso: node scripts/test-berkley-soap.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

const __dir = dirname(fileURLToPath(import.meta.url));

function loadEnv(envPath) {
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const l = line.trim();
      if (!l || l.startsWith("#")) continue;
      const eq = l.indexOf("=");
      if (eq === -1) continue;
      const key = l.slice(0, eq).trim();
      const val = l.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {}
}

loadEnv(resolve(__dir, "../.env"));

const config = {
  wsmobimpUrl: process.env.BERKLEY_WSMOBIMP_URL,
  usuario: process.env.BERKLEY_USUARIO,
  passwordNovedades: process.env.BERKLEY_PASSWORD,
  keyWsmobimp: process.env.BERKLEY_KEY,
};

console.log("Config:");
console.log("  wsmobimpUrl:", config.wsmobimpUrl);
console.log("  usuario:", config.usuario);
console.log("  keyWsmobimp:", config.keyWsmobimp ? config.keyWsmobimp.slice(0, 6) + "..." : "(vacío)");
console.log("  passwordNovedades:", config.passwordNovedades ? "***" : "(vacío)");
console.log();

if (!config.wsmobimpUrl || !config.usuario || !config.keyWsmobimp) {
  console.error("❌ Faltan variables de entorno de Berkley");
  process.exit(1);
}

// Polizas a probar (de FELDER MARTIN)
const polizas = [
  { rama: 4, poliza: 9054704, endoso: 0, label: "9054704 (id=477)" },
  { rama: 4, poliza: 9096828, endoso: 0, label: "9096828 (id=822)" },
];

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildEnvelope(cfg, rama, poliza, endoso) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header/>
  <soapenv:Body>
    <WSMOBImp_v2.Execute xmlns="BINet_17">
      <Entrada>
        <Usuario>${escapeXml(cfg.usuario)}</Usuario>
        <Key>${escapeXml(cfg.keyWsmobimp)}</Key>
        <Empresa>0</Empresa>
        <Rama>${rama}</Rama>
        <Poliza>${poliza}</Poliza>
        <Endoso>${endoso}</Endoso>
        <CopiaPoliza>N</CopiaPoliza>
        <CertificadoCobertura>N</CertificadoCobertura>
        <CertificadoMercosur>N</CertificadoMercosur>
        <ConstanciaPago>N</ConstanciaPago>
        <Cuponera>N</Cuponera>
        <ImprimeSolicitud>N</ImprimeSolicitud>
        <TarjetaCirculacion>S</TarjetaCirculacion>
        <SeguroObligAut>N</SeguroObligAut>
        <EnviaMail>N</EnviaMail>
        <Riesgos/>
      </Entrada>
    </WSMOBImp_v2.Execute>
  </soapenv:Body>
</soapenv:Envelope>`;
}

for (const p of polizas) {
  console.log(`\n→ Póliza ${p.label} (rama=${p.rama}, poliza=${p.poliza}, endoso=${p.endoso})`);

  const envelope = buildEnvelope(config, p.rama, p.poliza, p.endoso);

  let res, text;
  try {
    res = await fetch(config.wsmobimpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: `"BINet_17action/webservices.AWSMOBIMP_V2.Execute"`,
      },
      body: envelope,
    });
    text = await res.text();
  } catch (e) {
    console.log(`  ❌ Error de red: ${e.message}`);
    continue;
  }

  console.log(`  HTTP ${res.status}`);

  if (!res.ok) {
    console.log(`  ❌ HTTP error. Body (primeros 500 chars):\n  ${text.slice(0, 500)}`);
    continue;
  }

  const $ = cheerio.load(text, { xmlMode: true });

  // Detectar SOAP Fault
  const fault = $("*").filter((_, el) => {
    const n = el.tagName ?? el.name ?? "";
    return n.toLowerCase().includes("fault");
  }).first();
  if (fault.length) {
    const fs = fault.find("*").filter((_, el) => {
      const n = el.tagName ?? el.name ?? "";
      return n.toLowerCase() === "faultstring";
    }).first().text().trim();
    console.log(`  ❌ SOAP Fault: ${fs}`);
    console.log(`  Body: ${text.slice(0, 800)}`);
    continue;
  }

  // ErrorGeneralCodigo
  const errGenCod = $("*").filter((_, el) => {
    const n = el.tagName ?? el.name ?? "";
    return n.toLowerCase() === "errorgeneralcodigo";
  }).first().text().trim();
  const errGenDesc = $("*").filter((_, el) => {
    const n = el.tagName ?? el.name ?? "";
    return n.toLowerCase() === "errorgeneraldescripcion";
  }).first().text().trim();

  if (errGenCod && errGenCod !== "0") {
    console.log(`  ❌ ErrorGeneral: [${errGenCod}] ${errGenDesc}`);
    continue;
  }

  // ImpresionItems
  const items = [];
  $("*").each((_, el) => {
    const n = el.tagName ?? el.name ?? "";
    if (n.toLowerCase() === "impresionitem") {
      const block = $(el);
      const getField = (name) => {
        let v = "";
        block.find("*").filter((_, e) => {
          const nn = e.tagName ?? e.name ?? "";
          return nn.toLowerCase() === name.toLowerCase();
        }).first().each((_, e) => { v = $(e).text().trim(); });
        return v;
      };
      items.push({
        errorCodigo: getField("errorcodigo"),
        errorDescripcion: getField("errordescripcion"),
        nombre: getField("impresionnombre"),
        link: getField("impresion"),
      });
    }
  });

  if (!items.length) {
    console.log(`  ⚠ Sin ImpresionItems en la respuesta`);
    console.log(`  Body (primeros 1000):\n  ${text.slice(0, 1000)}`);
    continue;
  }

  for (const item of items) {
    if (item.errorCodigo && item.errorCodigo !== "0") {
      console.log(`  ❌ Error doc [${item.errorCodigo}]: ${item.errorDescripcion}`);
    } else {
      console.log(`  ✅ Documento: ${item.nombre}`);
      console.log(`     Link: ${item.link}`);
    }
  }
}
