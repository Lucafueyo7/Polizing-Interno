import { NextRequest } from "next/server"

// El chatbot envía X-API-Key en cada request.
// Esa key debe coincidir con CHATBOT_API_KEY en las variables de entorno del servidor.
export function requireApiKey(request: NextRequest): Response | null {
  const key = request.headers.get("x-api-key")
  if (!key || key !== process.env.CHATBOT_API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
