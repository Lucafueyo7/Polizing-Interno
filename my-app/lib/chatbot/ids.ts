import { prisma } from "@/lib/prisma";

export function buildPayReference(pagoId: number): string {
  return `PAY-${pagoId.toString().padStart(5, "0")}`;
}

export async function nextSolicitudNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SOL-${year}-`;
  const count = await prisma.solicitudes_polizas.count({
    where: { numero: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}
