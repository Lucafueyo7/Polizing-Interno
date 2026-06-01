/**
 * Lectura y validación de las credenciales/URLs de cada proveedor desde variables
 * de entorno (nunca desde la base). Se valida con Zod al instanciar el adapter:
 * si falta una credencial, falla claro y temprano. Ver `.env.example`.
 */

import "server-only";
import { z } from "zod";
import { InsurerError } from "./errors";

const fedpatSchema = z.object({
  baseUrl: z.string().url(),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
});

export type FedPatConfig = z.infer<typeof fedpatSchema>;

const berkleySchema = z.object({
  novedadesUrl: z.string().url(),
  wsmobimpUrl: z.string().url(),
  usuario: z.string().min(1),
  /** Password específico del WS de Novedades (distinto al de BINet). */
  passwordNovedades: z.string().min(1),
  /** Key específica del WS WSMOBImp. */
  keyWsmobimp: z.string().min(1),
});

export type BerkleyConfig = z.infer<typeof berkleySchema>;

function parseOrThrow<T>(schema: z.ZodType<T>, raw: unknown, provider: string): T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    throw new InsurerError(
      `Configuración incompleta para "${provider}". Revisá las variables de entorno (${missing}).`,
      { provider },
    );
  }
  return parsed.data;
}

export function loadFedPatConfig(): FedPatConfig {
  return parseOrThrow(
    fedpatSchema,
    {
      baseUrl: process.env.FEDPAT_BASE_URL,
      clientId: process.env.FEDPAT_CLIENT_ID,
      clientSecret: process.env.FEDPAT_CLIENT_SECRET,
      username: process.env.FEDPAT_USERNAME,
      password: process.env.FEDPAT_PASSWORD,
    },
    "federacion_patronal",
  );
}

export function loadBerkleyConfig(): BerkleyConfig {
  return parseOrThrow(
    berkleySchema,
    {
      novedadesUrl: process.env.BERKLEY_NOVEDADES_URL,
      wsmobimpUrl: process.env.BERKLEY_WSMOBIMP_URL,
      usuario: process.env.BERKLEY_USUARIO,
      passwordNovedades: process.env.BERKLEY_PASSWORD,
      keyWsmobimp: process.env.BERKLEY_KEY,
    },
    "berkley",
  );
}
