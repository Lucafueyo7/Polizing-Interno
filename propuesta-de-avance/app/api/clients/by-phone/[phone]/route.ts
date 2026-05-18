import { NextRequest } from "next/server"
import { requireApiKey } from "@/lib/auth"
import { PrismaClient } from "@/app/generated/prisma"

const prisma = new PrismaClient()

// GET /api/clients/by-phone/:phone
// El chatbot llama esto para verificar si el número tiene un cliente registrado.
// Si no existe o está dado de baja → 404.
export async function GET(
  request: NextRequest,
  { params }: { params: { phone: string } }
): Promise<Response> {
  const authError = requireApiKey(request)
  if (authError) return authError

  const cliente = await prisma.clientes.findFirst({
    where: {
      telefono: params.phone,
      estado: "activo",
    },
    include: {
      clientes_no_corporativos: true,
      clientes_corporativos: true,
    },
  })

  if (!cliente) {
    return Response.json({ error: "Client not found" }, { status: 404 })
  }

  // El chatbot solo necesita saber que el cliente existe y su nombre
  const full_name = cliente.clientes_no_corporativos
    ? `${cliente.clientes_no_corporativos.nombre} ${cliente.clientes_no_corporativos.apellido}`
    : (cliente.clientes_corporativos?.razon_social ?? "")

  return Response.json({
    id: cliente.id,
    phone: cliente.telefono,
    full_name,
    active: true,
  })
}
