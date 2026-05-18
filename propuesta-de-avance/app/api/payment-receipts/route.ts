import { NextRequest } from "next/server"
import { requireApiKey } from "@/lib/auth"
import { PaymentReceiptBody } from "@/types/chatbot"
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

// POST /api/payment-receipts
// Body que manda el chatbot:
// {
//   phone: "5491112345678",
//   policy: { id, policy_number, insurance_type, domain, description },
//   file: { media_id, mime_type, filename, content_base64 }
// }
//
// Crea un registro en `pagos` con estado "pendiente" y guarda el comprobante.
// El campo pagos.comprobante es String? — debería ser la URL del archivo en storage.
// Luego vincula la póliza a ese pago mediante polizas.pago_id.
export async function POST(request: NextRequest): Promise<Response> {
  const authError = requireApiKey(request)
  if (authError) return authError

  const body: PaymentReceiptBody = await request.json()

  // Verificar que la póliza pertenece al cliente
  const poliza = await prisma.polizas.findFirst({
    where: {
      id: body.policy.id,
      cliente: { telefono: body.phone },
    },
    include: { cliente: true },
  })

  if (!poliza) {
    return Response.json({ error: "Policy not found" }, { status: 404 })
  }

  // TODO: subir el archivo a storage y obtener la URL
  // const buffer = Buffer.from(body.file.content_base64 ?? "", "base64")
  // const storageUrl = await storage.upload(body.file.filename, buffer, body.file.mime_type)
  const storageUrl = `TODO: subir ${body.file.filename} a storage`

  // Crear el pago en estado pendiente
  const pago = await prisma.pagos.create({
    data: {
      cliente_id: poliza.cliente_id,
      monto: 0,           // el monto real lo completa el productor al validar
      estado: "pendiente",
      comprobante: storageUrl,
    },
  })

  // Vincular la póliza al pago
  await prisma.polizas.update({
    where: { id: poliza.id },
    data: { pago_id: pago.id },
  })

  const reference = `PAY-${pago.id.toString(16).toUpperCase().padStart(8, "0")}`
  return Response.json({ reference, status: "ok" }, { status: 201 })
}
