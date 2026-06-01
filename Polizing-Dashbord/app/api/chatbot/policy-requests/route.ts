import type { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/chatbot/auth";
import {
  badRequest,
  jsonCreated,
  serverError,
  unprocessable,
} from "@/lib/chatbot/responses";
import { formatZodIssues, policyRequestBodySchema } from "@/lib/chatbot/schemas";
import { createPolicyRequest } from "@/lib/chatbot/services/solicitudes";

export async function POST(request: NextRequest) {
  const auth = requireApiKey(request);
  if (auth) return auth;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return badRequest("JSON inválido");
  }
  const parsed = policyRequestBodySchema.safeParse(json);
  if (!parsed.success) return unprocessable(formatZodIssues(parsed.error));

  try {
    const out = await createPolicyRequest(parsed.data);
    return jsonCreated({ reference: out.reference, status: out.status });
  } catch (err) {
    console.error("[chatbot/policy-requests]", err);
    return serverError();
  }
}
