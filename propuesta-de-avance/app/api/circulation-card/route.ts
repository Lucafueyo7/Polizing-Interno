import { NextRequest } from "next/server"
import { requireApiKey } from "@/lib/auth"
import { CirculationCardBody } from "@/types/chatbot"
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

// POST /api/circulation-card
// Body: { phone: "...", policy_id: 1 }
//
// Busca la póliza verificando que pertenezca al cliente del teléfono.
// El campo polizas.tarjeta_circulacion_poliza es un String? que debería
// ser la URL del archivo en storage (S3, Supabase Storage, etc.).
// El chatbot espera recibir el contenido en base64 para reenviarlo por WhatsApp.
//
// Si la póliza no tiene tarjeta asignada → 404.
export async function POST(request: NextRequest): Promise<Response> {
  const authError = requireApiKey(request)
  if (authError) return authError

  const body: CirculationCardBody = await request.json()

  const poliza = await prisma.polizas.findFirst({
    where: {
      id: body.policy_id,
      cliente: { telefono: body.phone },
      estado: { in: ["vigente", "proxima"] },
    },
  })

  if (!poliza?.tarjeta_circulacion_poliza) {
    return Response.json({ error: "Card not found" }, { status: 404 })
  }

  // polizas.tarjeta_circulacion_poliza es una URL al archivo en storage.
  // Hay que descargarlo, convertirlo a base64 y devolverlo al chatbot.
  // TODO: reemplazar con el cliente de storage que uses (S3, Supabase, etc.)
  const fileUrl = poliza.tarjeta_circulacion_poliza
  const fileResponse = await fetch(fileUrl)
  const buffer = await fileResponse.arrayBuffer()
  const content_base64 = Buffer.from(buffer).toString("base64")
  const mime_type = fileResponse.headers.get("content-type") ?? "application/pdf"
  const filename = fileUrl.split("/").at(-1) ?? "tarjeta.pdf"

  return Response.json({ filename, mime_type, content_base64 })
}
