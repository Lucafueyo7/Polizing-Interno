import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^\d{6,15}$/, "El teléfono debe contener solo dígitos (6 a 15)");

export const mimeSchema = z
  .string()
  .regex(/^[a-z]+\/[a-z0-9+\-.]+$/i, "MIME inválido");

export const base64Schema = z
  .string()
  .min(1, "content_base64 vacío")
  .refine((s) => /^[A-Za-z0-9+/]+={0,2}$/.test(s), "content_base64 no es base64 válido");

export const mediaFileSchema = z.object({
  media_id: z.string().nullable().optional(),
  filename: z.string().trim().min(1, "filename requerido").max(255),
  mime_type: mimeSchema,
  content_base64: base64Schema,
});
export type MediaFileInput = z.infer<typeof mediaFileSchema>;

export const policyShapeSchema = z.object({
  id: z.number().int().positive(),
  policy_number: z.string().optional(),
  insurance_type: z.string().optional(),
  category: z.string().optional(),
  coverage: z.string().optional(),
  domain: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const circulationCardBodySchema = z.object({
  phone: phoneSchema,
  policy_id: z.number().int().positive(),
});

export const paymentReceiptBodySchema = z.object({
  phone: phoneSchema,
  policies: z.array(policyShapeSchema).min(1, "Debe indicar al menos una póliza"),
  files: z.array(mediaFileSchema).min(1, "Debe adjuntar al menos un archivo"),
});

export const claimBodySchema = z.object({
  phone: phoneSchema,
  policy: policyShapeSchema,
  date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Fecha en formato DD/MM/AAAA"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Hora en formato HH:MM"),
  place: z.string().trim().min(1, "place requerido"),
  description: z.string().trim().min(1, "description requerido"),
  third_parties: z.string(),
  driver_license: mediaFileSchema,
  vehicle_card: mediaFileSchema,
  police_report: mediaFileSchema.nullable(),
  additional_files: z.array(mediaFileSchema).default([]),
});
export type ClaimBodyInput = z.infer<typeof claimBodySchema>;

export const policyRequestBodySchema = z.object({
  phone: phoneSchema,
  insurance_type: z.enum(["auto", "moto"]),
  domain: z.string().trim().min(1, "domain requerido"),
  brand: z.string().trim().min(1, "brand requerido"),
  model: z.string().trim().min(1, "model requerido"),
  year: z.string().regex(/^\d{4}$/, "Año en formato AAAA"),
  use: z.enum(["particular", "comercial"]),
  notes: z.string().default(""),
});
export type PolicyRequestBodyInput = z.infer<typeof policyRequestBodySchema>;

export function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
    .join("; ");
}
