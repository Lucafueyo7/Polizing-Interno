"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";
import {
  PolizaSchema,
  type ActionResult,
  type PolizaInput,
} from "./schemas";

export async function createPoliza(input: PolizaInput): Promise<ActionResult> {
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
  try {
    const created = await prisma.polizas.create({
      data: {
        numero_poliza: data.numero,
        cliente_id: data.clienteId,
        aseguradora_id: data.aseguradoraId,
        tipo_seguro_id: data.tipoSeguroId,
        cobertura: data.cobertura,
        estado: data.estado,
        fecha_emision: new Date(`${data.fechaEmision}T00:00:00Z`),
        fecha_inicio_vigencia: new Date(`${data.fechaInicio}T00:00:00Z`),
        fecha_fin_vigencia: new Date(`${data.fechaFin}T00:00:00Z`),
        suma_asegurada: data.sumaAsegurada,
        prima_mensual: data.primaMensual,
      },
      select: { id: true },
    });

    updateTag(CACHE_TAGS.polizas);
    return { ok: true, id: created.id };
  } catch (err) {
    const message =
      err instanceof Error && /unique/i.test(err.message)
        ? "Ya existe una póliza con ese número."
        : "No se pudo crear la póliza.";
    return { ok: false, error: message };
  }
}
