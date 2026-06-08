/**
 * Test: pide la tarjeta de circulación para FELDER DAVID.
 * Uso: node scripts/test-tarjeta-felder.mjs
 * (Requiere node_modules instalados: npm install)
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import * as cheerio from "cheerio";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Cargar .env manualmente ──────────────────────────────────────────────────
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

const API_BASE = "https://polizing-interno.vercel.app";
const API_KEY  = process.env.CHATBOT_API_KEY ?? "";

// ── Normalizar URL de Postgres (password puede tener @) ─────────────────────
function normalizePgUrl(raw) {
  const protoEnd = raw.indexOf("://") + 3;
  const rest = raw.slice(protoEnd);
  const lastAt = rest.lastIndexOf("@");
  const userInfo = rest.slice(0, lastAt);
  const hostPart = rest.slice(lastAt + 1);
  const colon = userInfo.indexOf(":");
  const user = userInfo.slice(0, colon);
  const pass = decodeURIComponent(userInfo.slice(colon + 1));
  return raw.slice(0, protoEnd) + user + ":" + encodeURIComponent(pass) + "@" + hostPart;
}

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DIRECT_URL / DATABASE_URL");

  const pool = new pg.Pool({ connectionString: normalizePgUrl(url) });

  try {
    // 1. Buscar cliente por id
    const { rows: clientes } = await pool.query(`
      SELECT c.id, c.telefono, c.estado,
             COALESCE(nc.nombre || ' ' || nc.apellido, corp.razon_social, 'Sin nombre') AS nombre
      FROM clientes c
      LEFT JOIN clientes_no_corporativos nc ON nc.cliente_id = c.id
      LEFT JOIN clientes_corporativos corp ON corp.cliente_id = c.id
      WHERE c.id = 80
    `);

    if (!clientes.length) {
      console.error("❌ No se encontró FELDER DAVID");
      return;
    }

    for (const c of clientes) {
      console.log(`✅ id=${c.id}  nombre=${c.nombre}  tel=${c.telefono}  estado=${c.estado}`);

      if (!c.telefono) { console.log("   ❌ Sin teléfono\n"); continue; }

      // 2. Pólizas vigentes
      const { rows: polizas } = await pool.query(`
        SELECT id, numero_poliza, estado, rama, suplemento, aseguradora_id,
               (tarjeta_circulacion_pdf IS NOT NULL) as has_pdf,
               raw_berkley
        FROM polizas
        WHERE cliente_id = $1 AND estado IN ('vigente','proxima')
        ORDER BY id ASC
      `, [c.id]);

      if (!polizas.length) { console.log("   ❌ Sin pólizas vigentes\n"); continue; }

      console.log(`\n   Pólizas (${polizas.length}):`);
      for (const p of polizas) {
        console.log(`     [${p.id}] ${p.numero_poliza}  ${p.estado}  rama=${p.rama}  suplemento=${p.suplemento}  aseg_id=${p.aseguradora_id}  ${p.has_pdf ? "✅ PDF" : "⚠ sin PDF"}`);
        if (p.raw_berkley) {
          console.log(`        raw_berkley: ${JSON.stringify(p.raw_berkley)}`);
          const raw = p.raw_berkley;
          const rama = Number(raw?.rama ?? p.rama);
          const polizaNum = raw?.poliza ? Number(raw.poliza) : Number(p.numero_poliza.split("-")[0]);
          const endoso = Number(p.suplemento ?? 0);
          console.log(`        → params que se mandarían a Berkley: rama=${rama}  poliza=${polizaNum}  endoso=${endoso}`);
        }
      }

      // 3. Pedir tarjeta por cada póliza
      console.log("\n   🔄 Llamando al endpoint...\n");
      for (const p of polizas) {
        console.log(`   → ${p.numero_poliza} (id=${p.id})`);
        let body, status;
        try {
          const res = await fetch(`${API_BASE}/api/chatbot/circulation-card`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
            body: JSON.stringify({ phone: c.telefono, policy_id: p.id }),
          });
          status = res.status;
          body = await res.json().catch(() => null);
        } catch (e) {
          console.log(`     ❌ Error de red: ${e.message}\n`); continue;
        }

        if (status !== 200) { console.log(`     ❌ HTTP ${status}: ${JSON.stringify(body)}\n`); continue; }

        if (body?.mode === "link") {
          console.log(`     ✅ mode=link`);
          console.log(`        source_url: ${body.source_url}`);
          console.log(`        filename:   ${body.filename}`);
        } else if (body?.mode === "document") {
          const preview = (body.content_base64 ?? "").slice(0, 60);
          console.log(`     ✅ mode=document`);
          console.log(`        filename:   ${body.filename}`);
          console.log(`        base64[:60]: ${preview}...`);
        } else {
          console.log(`     ⚠  respuesta inesperada:`, JSON.stringify(body, null, 2));
        }
        console.log();
      }
      console.log();
    }
  } finally {
    await pool.end();
  }
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
