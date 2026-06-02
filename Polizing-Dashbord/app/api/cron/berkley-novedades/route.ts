/**
 * Cron diario de novedades de Berkley. Lo dispara Vercel Cron a las 07:00 UTC
 * (= 04:00 ART) con `Authorization: Bearer $CRON_SECRET`. Ver vercel.json.
 */

import { runBerkleySync } from "@/lib/insurers/providers/berkley/novedades";
import { insurerErrorResponse } from "@/lib/insurers/api-errors";

// El sync puede tardar (descarga + parseo de varios archivos).
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/berkley-novedades] CRON_SECRET no está definida");
    return Response.json({ error: "Cron no configurado" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await runBerkleySync();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return insurerErrorResponse("cron/berkley-novedades", err);
  }
}
