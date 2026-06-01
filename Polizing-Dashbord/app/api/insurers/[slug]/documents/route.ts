import type { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/chatbot/auth";
import { badRequest, jsonOk, unprocessable } from "@/lib/chatbot/responses";
import { formatZodIssues } from "@/lib/chatbot/schemas";
import { generateDocumentsBodySchema } from "@/lib/insurers/api-schemas";
import { insurerErrorResponse } from "@/lib/insurers/api-errors";
import { getProviderWithCapability } from "@/lib/insurers/registry";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const auth = requireApiKey(request);
  if (auth) return auth;

  const { slug } = await ctx.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return badRequest("JSON inválido");
  }

  const parsed = generateDocumentsBodySchema.safeParse(json);
  if (!parsed.success) return unprocessable(formatZodIssues(parsed.error));

  try {
    const provider = getProviderWithCapability(slug, "documents");
    const documentos = await provider.generateDocuments(parsed.data);
    return jsonOk({ documentos });
  } catch (err) {
    return insurerErrorResponse("insurers/documents", err);
  }
}
