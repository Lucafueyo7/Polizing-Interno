import { prisma } from "@/lib/prisma";
import { mapPolizaToChatbot, type PolicyChatbotShape } from "../mappers";

const POLIZA_INCLUDE = {
  tipo_seguro: { select: { nombre: true, categoria: true } },
  cobertura: { select: { nombre: true } },
  aseguradora: { select: { razon_social: true } },
} as const;

const ACTIVE_STATES = ["vigente"] as const;

/**
 * `vehiculos` (default): pólizas de vehículo para tarjeta de circulación,
 * siniestros y obtener póliza. Un vehículo es cualquier póliza de categoría
 * `auto` O con patente (`dominio`) cargada — así autos y motos/cuatris se
 * listan igual (las motos vienen de Berkley con patente pero sin categoría auto).
 * `todas`: todas las pólizas vigentes (para comprobantes de pago corporativos).
 */
export type PolizaScope = "vehiculos" | "todas";

export async function listVigentesByClienteId(
  clienteId: number,
  scope: PolizaScope = "vehiculos",
): Promise<PolicyChatbotShape[]> {
  const polizas = await prisma.polizas.findMany({
    where: {
      cliente_id: clienteId,
      estado: { in: [...ACTIVE_STATES] },
      ...(scope === "vehiculos"
        ? { OR: [{ tipo_seguro: { categoria: "auto" } }, { dominio: { not: null } }] }
        : {}),
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
