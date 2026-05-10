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

const email = z.string().trim().email("Email inválido");
const cuit = z
  .string()
  .trim()
  .regex(/^\d{2}-?\d{8}-?\d{1}$/, "CUIT inválido (11 dígitos)");
const dni = z
  .string()
  .trim()
  .regex(/^\d{7,8}$|^\d{1,2}\.\d{3}\.\d{3}$/, "DNI inválido (7-8 dígitos)");

export const ClienteCorpSchema = z.object({
  tipo: z.literal("corp"),
  razonSocial: trimmed(120),
  cuit,
  contactoNombre: optionalString(120),
  email,
  telefono: optionalString(40),
  direccion: optionalString(160),
  estado: z.enum(["activo", "baja"]),
});

export const ClienteNormalSchema = z.object({
  tipo: z.literal("normal"),
  nombre: trimmed(60),
  apellido: trimmed(60),
  dni,
  email,
  telefono: optionalString(40),
  direccion: optionalString(160),
  estado: z.enum(["activo", "baja"]),
});

export const ClienteSchema = z.discriminatedUnion("tipo", [
  ClienteCorpSchema,
  ClienteNormalSchema,
]);

export type ClienteInput = z.infer<typeof ClienteSchema>;
export type ClienteCorpInput = z.infer<typeof ClienteCorpSchema>;
export type ClienteNormalInput = z.infer<typeof ClienteNormalSchema>;

export type ActionResult =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
