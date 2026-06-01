import { z } from "zod";
import { normalizeTelefono } from "@/lib/format/telefono";
import { INSURER_SLUGS } from "@/lib/insurers/slugs";

const trimmed = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Requerido")
    .max(max, `Máximo ${max} caracteres`);

const optionalTelefono = z
  .string()
  .trim()
  .max(40, "Máximo 40 caracteres")
  .optional()
  .transform((v) => normalizeTelefono(v ?? null) ?? undefined)
  .refine((v) => v === undefined || /^\d{6,15}$/.test(v), {
    message: "El teléfono debe contener entre 6 y 15 dígitos",
  });

const cuit = z
  .string()
  .trim()
  .regex(/^\d{2}-?\d{8}-?\d{1}$/, "CUIT inválido (11 dígitos)");

export const AseguradoraSchema = z.object({
  razonSocial: trimmed(120),
  cuit,
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  telefono: optionalTelefono,
  codigoIntegracion: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine(
      (v) => v === undefined || (INSURER_SLUGS as readonly string[]).includes(v),
      "Integración inválida",
    ),
});

export type AseguradoraInput = z.infer<typeof AseguradoraSchema>;

export type ActionResult =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
