import { NextRequest } from "next/server"
import { requireApiKey } from "@/lib/auth"
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

// GET /api/policies?phone=:phone
// El chatbot llama esto cuando el usuario elige tarjeta, comprobante o siniestro.
// Devuelve solo pólizas vigentes o próximas a vencer.
//
// NOTA: el chatbot espera el campo "domain" (dominio/patente del vehículo).
// Ese campo no existe en el schema actual de polizas.
// Opciones: agregar `dominio String?` a polizas, o derivarlo de otro lado.
// Por ahora se devuelve vacío para no romper el flujo del chatbot.
export async function GET(request: NextRequest): Promise<Response> {
  const authError = requireApiKey(request)
  if (authError) return authError

  const phone = request.nextUrl.searchParams.get("phone")
  if (!phone) {
    return Response.json({ error: "Missing phone" }, { status: 400 })
  }

  const polizas = await prisma.polizas.findMany({
    where: {
      cliente: { telefono: phone },
      estado: { in: ["vigente", "proxima"] },
    },
    include: {
      tipo_seguro: true,
    },
  })

  const items = polizas.map((p) => ({
    id: p.id,
    policy_number: p.numero_poliza,
    insurance_type: p.tipo_seguro.nombre,
    domain: "",  // TODO: agregar campo dominio a polizas
    description: p.tipo_seguro.descripcion ?? p.tipo_seguro.nombre,
  }))

  return Response.json({ items })
}
