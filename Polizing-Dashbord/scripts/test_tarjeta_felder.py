"""
Test: pide la tarjeta de circulación para FELDER DAVID.

Uso (desde D:/Polizing-Interno/Polizing-Dashbord):
    python scripts/test_tarjeta_felder.py
"""

import os
import re
import json
from urllib.parse import urlparse, unquote

import httpx
import psycopg2
import psycopg2.extras


# ── Config ──────────────────────────────────────────────────────────────────

def load_env(path=".env"):
    """Carga variables de un archivo .env en os.environ."""
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    k, _, v = line.partition("=")
                    v = v.strip().strip('"').strip("'")
                    os.environ.setdefault(k.strip(), v)
    except FileNotFoundError:
        pass


def parse_pg_url(url: str):
    """Parsea un connection string de Postgres con password que puede contener @."""
    proto_end = url.index("://") + 3
    rest = url[proto_end:]
    last_at = rest.rfind("@")
    user_info = rest[:last_at]
    host_part = rest[last_at + 1:]

    colon = user_info.index(":")
    user = user_info[:colon]
    password = unquote(user_info[colon + 1:])

    # host_part: host:port/dbname?params
    m = re.match(r"([^:/]+):(\d+)/([^?]+)", host_part)
    if not m:
        raise ValueError(f"No se pudo parsear host de: {host_part}")
    host, port, dbname = m.group(1), int(m.group(2)), m.group(3)
    return dict(host=host, port=port, dbname=dbname, user=user, password=password)


def get_db():
    url = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("Falta DIRECT_URL / DATABASE_URL")
    return psycopg2.connect(**parse_pg_url(url))


API_BASE = "https://polizing-interno.vercel.app"


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    load_env()
    api_key = os.environ.get("CHATBOT_API_KEY", "")

    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # 1. Buscar FELDER DAVID
    cur.execute("""
        SELECT c.id, c.telefono, c.estado,
               nc.nombre, nc.apellido
        FROM chatbot.clientes c
        JOIN chatbot.clientes_no_corporativos nc ON nc.cliente_id = c.id
        WHERE (UPPER(nc.apellido) LIKE '%FELDER%' AND UPPER(nc.nombre) LIKE '%DAVID%')
           OR (UPPER(nc.apellido) LIKE '%DAVID%'  AND UPPER(nc.nombre) LIKE '%FELDER%')
        ORDER BY c.id ASC
        LIMIT 5;
    """)
    rows = cur.fetchall()

    if not rows:
        print("❌ No se encontró FELDER DAVID en clientes_no_corporativos")
        cur.close(); conn.close()
        return

    for row in rows:
        cliente_id = row["id"]
        telefono = row["telefono"]
        print(f"✅ Cliente encontrado: id={cliente_id}  nombre={row['nombre']} {row['apellido']}")
        print(f"   teléfono={telefono}  estado={row['estado']}")

        if not telefono:
            print("   ❌ Sin teléfono — saltando\n")
            continue

        # 2. Pólizas vigentes
        cur.execute("""
            SELECT id, numero_poliza, estado, rama, suplemento, aseguradora_id,
                   (tarjeta_circulacion_pdf IS NOT NULL) as has_pdf
            FROM chatbot.polizas
            WHERE cliente_id = %s AND estado IN ('vigente', 'proxima')
            ORDER BY id ASC;
        """, (cliente_id,))
        polizas = cur.fetchall()

        if not polizas:
            print("   ❌ Sin pólizas vigentes/próximas\n")
            continue

        print(f"\n   📋 Pólizas vigentes ({len(polizas)}):")
        for p in polizas:
            pdf_tag = "✅ PDF" if p["has_pdf"] else "⚠️  sin PDF"
            print(f"     [{p['id']}] {p['numero_poliza']}  estado={p['estado']}  rama={p['rama']}  {pdf_tag}")

        # 3. Llamar al endpoint por cada póliza
        print("\n   🔄 Solicitando tarjetas...\n")
        headers = {"Content-Type": "application/json", "X-API-Key": api_key}

        for p in polizas:
            payload = {"phone": telefono, "policy_id": p["id"]}
            print(f"   → Póliza {p['numero_poliza']} (id={p['id']})")

            r = httpx.post(
                f"{API_BASE}/api/chatbot/circulation-card",
                headers=headers,
                json=payload,
                timeout=30,
            )

            try:
                body = r.json()
            except Exception:
                body = None

            if not r.is_success:
                print(f"     ❌ HTTP {r.status_code}: {body}\n")
                continue

            mode = body.get("mode") if body else None
            if mode == "link":
                print(f"     ✅ mode=link")
                print(f"        source_url: {body['source_url']}")
                print(f"        filename:   {body['filename']}")
            elif mode == "document":
                b64 = (body.get("content_base64") or "")[:60]
                print(f"     ✅ mode=document (PDF cacheado)")
                print(f"        filename:   {body['filename']}")
                print(f"        mime:       {body['mime_type']}")
                print(f"        base64[:60]: {b64}...")
            else:
                print(f"     ⚠️  Respuesta inesperada: {json.dumps(body, indent=6)}")
            print()

        print()

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
