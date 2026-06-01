import type { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/chatbot/auth";
import { jsonOk } from "@/lib/chatbot/responses";
import { insurerErrorResponse } from "@/lib/insurers/api-errors";
import { getProviderWithCapability } from "@/lib/insurers/registry";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const auth = requireApiKey(request);
  if (auth) return auth;

  const { slug } = await ctx.params;

  try {
    const provider = getProviderWithCapability(slug, "cartera");
    const cartera = await provider.getCartera({});
    return jsonOk(cartera);
  } catch (err) {
    return insurerErrorResponse("insurers/cartera", err);
  }
}
