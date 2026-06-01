/**
 * Mapea los errores de integración a respuestas HTTP coherentes con el resto de
 * la API (mismo formato `{ error }` que `lib/chatbot/responses`).
 */

import {
  InsurerAuthError,
  InsurerBusinessError,
  InsurerError,
  NotSupportedError,
} from "./errors";

export function insurerErrorResponse(scope: string, err: unknown): Response {
  if (err instanceof NotSupportedError) {
    return Response.json({ error: err.message }, { status: 422 });
  }
  if (err instanceof InsurerBusinessError) {
    return Response.json({ error: err.message, code: err.code }, { status: 422 });
  }
  if (err instanceof InsurerAuthError) {
    console.error(`[${scope}]`, err);
    return Response.json(
      { error: "Fallo de autenticación con la aseguradora" },
      { status: 502 },
    );
  }
  if (err instanceof InsurerError) {
    console.error(`[${scope}]`, err);
    return Response.json(
      { error: "Error al contactar la aseguradora", detail: err.detail },
      { status: 502 },
    );
  }
  console.error(`[${scope}]`, err);
  return Response.json({ error: "Error interno" }, { status: 500 });
}
