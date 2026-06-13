import type { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/chatbot/auth";
import {
  badRequest,
  jsonOk,
  notFound,
  serverError,
  unprocessable,
} from "@/lib/chatbot/responses";
import { formatZodIssues, policyDocumentBodySchema } from "@/lib/chatbot/schemas";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";
import { refreshAndGetPolicyDoc } from "@/lib/chatbot/services/policy-document";

export async function POST(request: NextRequest) {
  const auth = requireApiKey(request);
  if (auth) return auth;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return badRequest("JSON inválido");
  }
  const parsed = policyDocumentBodySchema.safeParse(json);
  if (!parsed.success) return unprocessable(formatZodIssues(parsed.error));

  try {
    const cliente = await findActiveByTelefono(parsed.data.phone);
    if (!cliente) return notFound("Cliente no encontrado");
    const doc = await refreshAndGetPolicyDoc(cliente.id, parsed.data.policy_id);
    if (!doc) return notFound("Póliza no disponible");
    return jsonOk(doc);
  } catch (err) {
    console.error("[chatbot/policy-document]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return serverError(msg);
  }
}
