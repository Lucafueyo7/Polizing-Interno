import type { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/chatbot/auth";
import { jsonOk, notFound, serverError } from "@/lib/chatbot/responses";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/chatbot/clients/by-phone/[phone]">,
) {
  const auth = requireApiKey(request);
  if (auth) return auth;

  try {
    const { phone } = await ctx.params;
    const cliente = await findActiveByTelefono(phone);
    if (!cliente) return notFound("Cliente no encontrado");
    return jsonOk(cliente.shape);
  } catch (err) {
    console.error("[chatbot/clients/by-phone]", err);
    return serverError();
  }
}
