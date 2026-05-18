import { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/auth";
import { ClaimBody, MediaFile } from "@/types/chatbot";
import { PrismaClient, DocumentoTipo } from "@/app/generated/prisma";

const prisma = new PrismaClient();

// POST /api/claims
// Body que manda el chatbot (10 pasos):
// {
//   phone,
//   policy,
//   date,
//   time,
//   place,
//   description,
//   third_parties,
//   driver_license,
//   vehicle_card, police_report | null,
//   additional_files: []
// }
//
// Crea un siniestro con estado "nuevo" y sus documentos asociados.
// Los archivos llegan en base64 — hay que subirlos a storage antes de guardar la URL.
export async function POST(request: NextRequest): Promise<Response> {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const body: ClaimBody = await request.json();

  // Verificar que la póliza pertenece al cliente
  const poliza = await prisma.polizas.findFirst({
    where: {
      id: body.policy.id,
      cliente: { telefono: body.phone },
    },
  });

  if (!poliza) {
    return Response.json({ error: "Policy not found" }, { status: 404 });
  }

  // Parsear fecha y hora del siniestro
  // El chatbot manda date como "DD/MM/YYYY" y time como "HH:MM"
  const [day, month, year] = body.date.split("/").map(Number);
  const [hour, minute] = body.time.split(":").map(Number);
  const fecha_ocurrencia = new Date(year, month - 1, day, hour, minute);

  // Número único del siniestro
  const numero = `SIN-${Date.now().toString(16).toUpperCase()}`;

  // Armar descripción completa combinando los campos del chatbot
  const descripcion_hechos = [
    `Lugar: ${body.place}`,
    `Descripción: ${body.description}`,
    body.third_parties ? `Terceros: ${body.third_parties}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // TODO: subir cada archivo a storage y obtener su URL
  // const url = await storage.upload(file.filename, Buffer.from(file.content_base64 ?? "", "base64"), file.mime_type)
  const uploadFile = async (file: MediaFile): Promise<string> => {
    return `TODO: subir ${file.filename} a storage`;
  };

  const mimeToDocTipo = (mime: string): DocumentoTipo =>
    mime === "application/pdf" ? "pdf" : "img";

  // Preparar todos los documentos del siniestro
  const documentosData = await Promise.all([
    // Carnet de conducir
    uploadFile(body.driver_license).then((url) => ({
      tipo: mimeToDocTipo(body.driver_license.mime_type),
      nombre: body.driver_license.filename,
      url,
      mime_type: body.driver_license.mime_type,
    })),
    // Tarjeta verde
    uploadFile(body.vehicle_card).then((url) => ({
      tipo: mimeToDocTipo(body.vehicle_card.mime_type),
      nombre: body.vehicle_card.filename,
      url,
      mime_type: body.vehicle_card.mime_type,
    })),
    // Acta policial (opcional)
    ...(body.police_report
      ? [
          uploadFile(body.police_report).then((url) => ({
            tipo: mimeToDocTipo(body.police_report!.mime_type),
            nombre: body.police_report!.filename,
            url,
            mime_type: body.police_report!.mime_type,
          })),
        ]
      : []),
    // Fotos adicionales
    ...body.additional_files.map((file) =>
      uploadFile(file).then((url) => ({
        tipo: mimeToDocTipo(file.mime_type),
        nombre: file.filename,
        url,
        mime_type: file.mime_type,
      })),
    ),
  ]);

  const siniestro = await prisma.siniestros.create({
    data: {
      poliza_id: poliza.id,
      numero,
      titulo: `Siniestro del ${body.date}`,
      fecha_ocurrencia,
      fecha_reporte: new Date(),
      descripcion_hechos,
      estado: "nuevo",
      documentos: {
        create: documentosData,
      },
    },
  });

  const reference = `SIN-${siniestro.id.toString(16).toUpperCase().padStart(8, "0")}`;
  return Response.json({ reference, status: "ok" }, { status: 201 });
}
