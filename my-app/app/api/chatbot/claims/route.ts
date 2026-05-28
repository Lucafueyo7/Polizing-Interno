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
import { claimBodySchema, formatZodIssues } from "@/lib/chatbot/schemas";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";
import { getOwnedById } from "@/lib/chatbot/services/polizas";
import { createWithDocuments } from "@/lib/chatbot/services/siniestros";
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
  const parsed = claimBodySchema.safeParse(json);
  if (!parsed.success) return unprocessable(formatZodIssues(parsed.error));

  try {
    const cliente = await findActiveByTelefono(parsed.data.phone);
    if (!cliente) return notFound("Cliente no encontrado");
    const poliza = await getOwnedById(cliente.id, parsed.data.policy.id);
    if (!poliza) return notFound("Póliza no encontrada");

    let driver_license: DecodedFile;
    let vehicle_card: DecodedFile;
    let police_report: DecodedFile | null = null;
    let additional_files: DecodedFile[];
    let totalBytes = 0;
    try {
      driver_license = decodeBase64File(parsed.data.driver_license);
      vehicle_card = decodeBase64File(parsed.data.vehicle_card);
      if (parsed.data.police_report) {
        police_report = decodeBase64File(parsed.data.police_report);
      }
      additional_files = parsed.data.additional_files.map(decodeBase64File);
      totalBytes = [driver_license, vehicle_card, ...(police_report ? [police_report] : []), ...additional_files]
        .reduce((acc, f) => acc + f.size, 0);
    } catch (err) {
      if (err instanceof FileDecodeError) {
        return err.status === 413 ? payloadTooLarge(err.message) : unprocessable(err.message);
      }
      throw err;
    }
    if (totalBytes > MAX_TOTAL_BYTES) {
      return payloadTooLarge("Suma de archivos excede el límite total");
    }

    const result = await createWithDocuments({
      policyId: poliza.id,
      numeroPoliza: poliza.policy_number,
      date: parsed.data.date,
      time: parsed.data.time,
      place: parsed.data.place,
      description: parsed.data.description,
      third_parties: parsed.data.third_parties,
      files: { driver_license, vehicle_card, police_report, additional_files },
    });
    return jsonCreated(result);
  } catch (err) {
    console.error("[chatbot/claims]", err);
    return serverError();
  }
}
