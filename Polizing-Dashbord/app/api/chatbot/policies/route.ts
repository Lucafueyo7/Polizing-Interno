import type { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/chatbot/auth";
import { badRequest, jsonOk, serverError, unprocessable } from "@/lib/chatbot/responses";
import { phoneSchema } from "@/lib/chatbot/schemas";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";
import { listVigentesByClienteId, type PolizaScope } from "@/lib/chatbot/services/polizas";

export async function GET(request: NextRequest) {
  const auth = requireApiKey(request);
  if (auth) return auth;

  const phoneParam = request.nextUrl.searchParams.get("phone");
  if (!phoneParam) return badRequest("Falta query param `phone`");
  const parsed = phoneSchema.safeParse(phoneParam);
  if (!parsed.success) return unprocessable("phone inválido");

  // `scope=todas` → todas las pólizas (pagos); por defecto sólo vehículos.
  const scope: PolizaScope = request.nextUrl.searchParams.get("scope") === "todas" ? "todas" : "vehiculos";

  try {
    const cliente = await findActiveByTelefono(parsed.data);
    if (!cliente) return jsonOk({ items: [] });
    const items = await listVigentesByClienteId(cliente.id, scope);
    return jsonOk({ items });
  } catch (err) {
    console.error("[chatbot/policies]", err);
    return serverError();
  }
}
