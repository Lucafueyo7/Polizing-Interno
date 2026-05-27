import { z } from "zod";

const trimmed = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Requerido")
    .max(max, `Máximo ${max} caracteres`);

const isoDateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const SiniestroSchema = z.object({
  polizaId: z.number().int().positive("Póliza requerida"),
  numero: trimmed(40),
  titulo: trimmed(160),
  fechaOcurrencia: isoDateString,
  estado: z.enum([
    "nuevo",
    "pendiente_documentacion",
    "en_tramite",
    "cerrado",
    "rechazado",
  ]),
});

export type SiniestroInput = z.infer<typeof SiniestroSchema>;

export type ActionResult =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
