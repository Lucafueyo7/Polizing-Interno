import { z } from "zod";

const trimmed = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Requerido")
    .max(max, `Máximo ${max} caracteres`);

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

const cuit = z
  .string()
  .trim()
  .regex(/^\d{2}-?\d{8}-?\d{1}$/, "CUIT inválido (11 dígitos)");

export const AseguradoraSchema = z.object({
  razonSocial: trimmed(120),
  cuit,
  contactoNombre: optionalString(120),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  telefono: optionalString(40),
  direccion: optionalString(160),
});

export type AseguradoraInput = z.infer<typeof AseguradoraSchema>;

export type ActionResult =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
