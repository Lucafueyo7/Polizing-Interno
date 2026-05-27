import { z } from "zod";

const positiveDecimal = (label: string) =>
  z
    .number({ message: `${label} inválido` })
    .positive(`${label} debe ser mayor que cero`);

const isoDateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const PolizaSchema = z
  .object({
    numero: z
      .string()
      .trim()
      .min(1, "Requerido")
      .max(40, "Máximo 40 caracteres"),
    clienteId: z.number().int().positive("Cliente requerido"),
    aseguradoraId: z.number().int().positive("Aseguradora requerida"),
    tipoSeguroId: z.number().int().positive("Tipo de seguro requerido"),
    coberturaId: z.number().int().positive("Cobertura requerida"),
    estado: z.enum(["vigente", "proxima", "vencida", "anulada", "renovada"]),
    fechaInicio: isoDateString,
    fechaFin: isoDateString,
    sumaAsegurada: positiveDecimal("Suma asegurada"),
    primaMensual: positiveDecimal("Prima mensual"),
  })
  .refine(
    (data) => new Date(data.fechaInicio) <= new Date(data.fechaFin),
    {
      message: "El fin de vigencia debe ser posterior al inicio",
      path: ["fechaFin"],
    },
  );

export type PolizaInput = z.infer<typeof PolizaSchema>;

export type ActionResult =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
