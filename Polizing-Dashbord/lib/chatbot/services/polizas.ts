import { prisma } from "@/lib/prisma";
import { mapPolizaToChatbot, type PolicyChatbotShape } from "../mappers";

const POLIZA_INCLUDE = {
  tipo_seguro: { select: { nombre: true, categoria: true } },
  cobertura: { select: { nombre: true } },
  aseguradora: { select: { razon_social: true } },
} as const;

const ACTIVE_STATES = ["vigente", "proxima"] as const;

export async function listVigentesByClienteId(clienteId: number): Promise<PolicyChatbotShape[]> {
  const polizas = await prisma.polizas.findMany({
    where: {
      cliente_id: clienteId,
      estado: { in: [...ACTIVE_STATES] },
      tipo_seguro: { categoria: "auto" },
    },
    include: POLIZA_INCLUDE,
    orderBy: { dominio: "asc" },
  });
  return polizas.map(mapPolizaToChatbot);
}

export async function getOwnedById(
  clienteId: number,
  policyId: number,
): Promise<PolicyChatbotShape | null> {
  const poliza = await prisma.polizas.findFirst({
    where: {
      id: policyId,
      cliente_id: clienteId,
      estado: { in: [...ACTIVE_STATES] },
    },
    include: POLIZA_INCLUDE,
  });
  return poliza ? mapPolizaToChatbot(poliza) : null;
}
