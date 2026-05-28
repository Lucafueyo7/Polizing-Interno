import type { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/chatbot/auth";
import {
  badRequest,
  jsonOk,
  notFound,
  serverError,
  unprocessable,
} from "@/lib/chatbot/responses";
import { circulationCardBodySchema, formatZodIssues } from "@/lib/chatbot/schemas";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";
import { getCard } from "@/lib/chatbot/services/circulation";

export async function POST(request: NextRequest) {
  const auth = requireApiKey(request);
  if (auth) return auth;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return badRequest("JSON inválido");
  }
  const parsed = circulationCardBodySchema.safeParse(json);
  if (!parsed.success) return unprocessable(formatZodIssues(parsed.error));

  try {
    const cliente = await findActiveByTelefono(parsed.data.phone);
    if (!cliente) return notFound("Cliente no encontrado");
    const card = await getCard(cliente.id, parsed.data.policy_id);
    if (!card) return notFound("Tarjeta de circulación no disponible");
    return jsonOk(card);
  } catch (err) {
    console.error("[chatbot/circulation-card]", err);
    return serverError();
  }
}
