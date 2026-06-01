import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { nextSolicitudNumero } from "../ids";
import { findActiveByTelefono } from "./clientes";
import type { PolicyRequestBodyInput } from "../schemas";

export async function createPolicyRequest(
  payload: PolicyRequestBodyInput,
): Promise<{ reference: string; status: "ok"; cliente_id: number | null }> {
  const cliente = await findActiveByTelefono(payload.phone);
  const numero = await nextSolicitudNumero();

  const created = await prisma.solicitudes_polizas.create({
    data: {
      numero,
      cliente_id: cliente?.id ?? null,
      telefono: payload.phone,
      insurance_type: payload.insurance_type,
      dominio: payload.domain,
      marca: payload.brand,
      modelo: payload.model,
      anio: payload.year,
      uso: payload.use,
      notas: payload.notes || null,
      estado: "nueva",
    },
    select: { id: true, numero: true, cliente_id: true },
  });

  revalidateTag(CACHE_TAGS.solicitudes, "minutes");
  return {
    reference: created.numero,
    status: "ok",
    cliente_id: created.cliente_id,
  };
}
