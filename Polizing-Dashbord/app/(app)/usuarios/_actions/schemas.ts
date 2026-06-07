import { z } from "zod";

export const CreateUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido").max(60, "Máximo 60 caracteres"),
  apellido: z.string().trim().min(1, "Requerido").max(60, "Máximo 60 caracteres"),
  email: z.string().trim().email("Email inválido"),
  dni: z
    .string()
    .trim()
    .regex(/^\d{7,8}$|^\d{1,2}\.\d{3}\.\d{3}$/, "DNI inválido (7-8 dígitos)"),
  rol: z.enum(["productor", "administrativo"]),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(72, "Máximo 72 caracteres"),
});

export type CreateUsuarioInput = z.infer<typeof CreateUsuarioSchema>;

export const UpdateUsuarioSchema = z.object({
  id: z.number().int().positive(),
  nombreCompleto: z.string().trim().min(2, "Requerido").max(120, "Máximo 120 caracteres"),
  rol: z.enum(["productor", "administrativo"]),
});

export type UpdateUsuarioInput = z.infer<typeof UpdateUsuarioSchema>;

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
