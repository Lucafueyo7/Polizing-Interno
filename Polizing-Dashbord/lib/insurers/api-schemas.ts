/** Schemas Zod compartidos por los endpoints de integración. */

import { z } from "zod";

export const documentoTipoSchema = z.enum([
  "poliza",
  "tarjeta_circulacion",
  "certificado_cobertura",
  "certificado_mercosur",
  "constancia_pago",
  "cuponera",
]);

export const generateDocumentsBodySchema = z.object({
  documentos: z.array(documentoTipoSchema).min(1, "documentos no puede estar vacío"),
  params: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .default({}),
});

export type GenerateDocumentsBody = z.infer<typeof generateDocumentsBodySchema>;
