"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  PolizaSchema,
  type ActionResult,
  type PolizaInput,
} from "./schemas";

export async function updatePoliza(
  id: number,
  input: PolizaInput,
): Promise<ActionResult> {
  const parsed = PolizaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;
  const user = await getCurrentUser();
  const audit = user?.id
    ? { modificado_por_id: user.id, modificado_en: new Date() }
    : {};
  try {
    await prisma.polizas.update({
      where: { id },
      data: {
        ...audit,
        numero_poliza: data.numero,
        cliente_id: data.clienteId,
        aseguradora_id: data.aseguradoraId,
        tipo_seguro_id: data.tipoSeguroId,
        cobertura_id: data.coberturaId,
        estado: data.estado,
        fecha_inicio_vigencia: new Date(`${data.fechaInicio}T00:00:00Z`),
        fecha_fin_vigencia: new Date(`${data.fechaFin}T00:00:00Z`),
        suma_asegurada: data.sumaAsegurada,
        prima_mensual: data.primaMensual,
      },
    });

    updateTag(CACHE_TAGS.polizas);
    return { ok: true, id };
  } catch (err) {
    const message =
      err instanceof Error && /unique/i.test(err.message)
        ? "Ya existe otra póliza con ese número."
        : "No se pudo actualizar la póliza.";
    return { ok: false, error: message };
  }
}
