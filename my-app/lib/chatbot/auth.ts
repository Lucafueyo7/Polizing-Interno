import { timingSafeEqual } from "node:crypto";
import { serviceUnavailable, unauthorized } from "./responses";

export function requireApiKey(req: Request): Response | null {
  const expected = process.env.CHATBOT_API_KEY;
  if (!expected) {
    console.error("[chatbot/auth] CHATBOT_API_KEY no está definida");
    return serviceUnavailable("Integración no configurada");
  }
  const provided = req.headers.get("x-api-key");
  if (!provided) return unauthorized();

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return unauthorized();
  if (!timingSafeEqual(a, b)) return unauthorized();
  return null;
}
