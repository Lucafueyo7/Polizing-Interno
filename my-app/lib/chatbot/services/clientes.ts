import { prisma } from "@/lib/prisma";
import { mapClienteToChatbot, type ClienteChatbotShape } from "../mappers";

export type FoundCliente = {
  id: number;
  full_name: string;
  shape: ClienteChatbotShape;
};

export async function findActiveByTelefono(phone: string): Promise<FoundCliente | null> {
  const cliente = await prisma.clientes.findFirst({
    where: { telefono: phone, estado: "activo" },
    orderBy: { id: "asc" },
    include: {
      clientes_corporativos: { select: { razon_social: true } },
      clientes_no_corporativos: { select: { nombre: true, apellido: true } },
    },
  });
  if (!cliente) return null;
  const shape = mapClienteToChatbot(cliente);
  return { id: cliente.id, full_name: shape.full_name, shape };
}
