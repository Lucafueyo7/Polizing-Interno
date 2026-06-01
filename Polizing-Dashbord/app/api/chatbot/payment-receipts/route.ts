import type { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/chatbot/auth";
import {
  badRequest,
  jsonCreated,
  notFound,
  payloadTooLarge,
  serverError,
  unprocessable,
} from "@/lib/chatbot/responses";
import { formatZodIssues, paymentReceiptBodySchema } from "@/lib/chatbot/schemas";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";
import { getOwnedById } from "@/lib/chatbot/services/polizas";
import { createFromReceipt } from "@/lib/chatbot/services/pagos";
import { FileDecodeError, MAX_TOTAL_BYTES, decodeBase64File } from "@/lib/chatbot/files";

export async function POST(request: NextRequest) {
  const auth = requireApiKey(request);
  if (auth) return auth;

  const len = Number(request.headers.get("content-length") ?? 0);
  if (len > MAX_TOTAL_BYTES) return payloadTooLarge();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return badRequest("JSON inválido");
  }
  const parsed = paymentReceiptBodySchema.safeParse(json);
  if (!parsed.success) return unprocessable(formatZodIssues(parsed.error));

  try {
    const cliente = await findActiveByTelefono(parsed.data.phone);
    if (!cliente) return notFound("Cliente no encontrado");
    const poliza = await getOwnedById(cliente.id, parsed.data.policy.id);
    if (!poliza) return notFound("Póliza no encontrada");

    let file;
    try {
      file = decodeBase64File(parsed.data.file);
    } catch (err) {
      if (err instanceof FileDecodeError) {
        return err.status === 413 ? payloadTooLarge(err.message) : unprocessable(err.message);
      }
      throw err;
    }

    const result = await createFromReceipt({
      clienteId: cliente.id,
      policyId: poliza.id,
      file,
    });
    return jsonCreated(result);
  } catch (err) {
    console.error("[chatbot/payment-receipts]", err);
    return serverError();
  }
}
