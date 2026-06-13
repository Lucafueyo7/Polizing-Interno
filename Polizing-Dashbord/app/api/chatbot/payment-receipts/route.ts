import type { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/chatbot/auth";
import {
  badRequest,
  forbidden,
  jsonCreated,
  notFound,
  payloadTooLarge,
  serverError,
  unprocessable,
} from "@/lib/chatbot/responses";
import { formatZodIssues, paymentReceiptBodySchema } from "@/lib/chatbot/schemas";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";
import { getOwnedById } from "@/lib/chatbot/services/polizas";
import { createFromReceipts } from "@/lib/chatbot/services/pagos";
import {
  FileDecodeError,
  MAX_TOTAL_BYTES,
  decodeBase64File,
  type DecodedFile,
} from "@/lib/chatbot/files";

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
    // Adjuntar comprobantes es exclusivo de clientes corporativos.
    if (!cliente.shape.is_corporate) {
      return forbidden("Solo los clientes corporativos pueden adjuntar comprobantes de pago");
    }

    // Cada póliza indicada debe pertenecer al cliente.
    const polizas = await Promise.all(
      parsed.data.policies.map((p) => getOwnedById(cliente.id, p.id)),
    );
    if (polizas.some((p) => !p)) return notFound("Póliza no encontrada");
    const policyIds = polizas.map((p) => p!.id);

    let files: DecodedFile[];
    try {
      files = parsed.data.files.map(decodeBase64File);
    } catch (err) {
      if (err instanceof FileDecodeError) {
        return err.status === 413 ? payloadTooLarge(err.message) : unprocessable(err.message);
      }
      throw err;
    }
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) return payloadTooLarge();

    const result = await createFromReceipts({
      clienteId: cliente.id,
      policyIds,
      files,
    });
    return jsonCreated(result);
  } catch (err) {
    console.error("[chatbot/payment-receipts]", err);
    return serverError();
  }
}
