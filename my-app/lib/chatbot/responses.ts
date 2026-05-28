export function jsonOk<T>(data: T): Response {
  return Response.json(data, { status: 200 });
}

export function jsonCreated<T>(data: T): Response {
  return Response.json(data, { status: 201 });
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export const badRequest = (message: string) => jsonError(message, 400);
export const unauthorized = (message = "API key inválida") => jsonError(message, 401);
export const notFound = (message = "Recurso no encontrado") => jsonError(message, 404);
export const payloadTooLarge = (message = "Payload demasiado grande") => jsonError(message, 413);
export const unprocessable = (message: string) => jsonError(message, 422);
export const serviceUnavailable = (message: string) => jsonError(message, 503);
export const serverError = (message = "Error interno") => jsonError(message, 500);
