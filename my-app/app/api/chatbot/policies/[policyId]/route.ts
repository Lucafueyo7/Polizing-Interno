import type { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/chatbot/auth";
import {
  badRequest,
  jsonOk,
  notFound,
  serverError,
  unprocessable,
} from "@/lib/chatbot/responses";
import { phoneSchema } from "@/lib/chatbot/schemas";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";
import { getOwnedById } from "@/lib/chatbot/services/polizas";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/chatbot/policies/[policyId]">,
) {
  const auth = requireApiKey(request);
  if (auth) return auth;

  const phoneParam = request.nextUrl.searchParams.get("phone");
  if (!phoneParam) return badRequest("Falta query param `phone`");
  const phoneRes = phoneSchema.safeParse(phoneParam);
  if (!phoneRes.success) return unprocessable("phone inválido");

  const { policyId: policyIdParam } = await ctx.params;
  const policyId = Number(policyIdParam);
  if (!Number.isInteger(policyId) || policyId <= 0) {
    return unprocessable("policyId inválido");
  }

  try {
    const cliente = await findActiveByTelefono(phoneRes.data);
    if (!cliente) return notFound("Cliente no encontrado");
    const poliza = await getOwnedById(cliente.id, policyId);
    if (!poliza) return notFound("Póliza no encontrada");
    return jsonOk(poliza);
  } catch (err) {
    console.error("[chatbot/policies/[policyId]]", err);
    return serverError();
  }
}
