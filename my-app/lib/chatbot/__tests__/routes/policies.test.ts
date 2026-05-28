import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/chatbot/services/clientes", () => ({
  findActiveByTelefono: vi.fn(),
}));
vi.mock("@/lib/chatbot/services/polizas", () => ({
  listVigentesByClienteId: vi.fn(),
}));

import { GET } from "@/app/api/chatbot/policies/route";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";
import { listVigentesByClienteId } from "@/lib/chatbot/services/polizas";

const NextRequest = require("next/server").NextRequest;

function makeReq(url: string, apiKey: string | null = "test-key") {
  const headers = apiKey ? { "x-api-key": apiKey } : {};
  return new NextRequest(`http://localhost${url}`, { headers });
}

describe("GET /api/chatbot/policies", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sin api key → 401", async () => {
    const res = await GET(makeReq("/api/chatbot/policies?phone=5491112345678", null));
    expect(res.status).toBe(401);
  });

  it("sin phone → 400", async () => {
    const res = await GET(makeReq("/api/chatbot/policies"));
    expect(res.status).toBe(400);
  });

  it("phone inválido → 422", async () => {
    const res = await GET(makeReq("/api/chatbot/policies?phone=abc"));
    expect(res.status).toBe(422);
  });

  it("cliente inexistente → 200 con items=[]", async () => {
    (findActiveByTelefono as any).mockResolvedValue(null);
    const res = await GET(makeReq("/api/chatbot/policies?phone=5491112345678"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [] });
  });

  it("happy → 200 con items mapeados", async () => {
    (findActiveByTelefono as any).mockResolvedValue({ id: 1, full_name: "x", shape: {} });
    (listVigentesByClienteId as any).mockResolvedValue([
      { id: 7, policy_number: "AUTO-1001", insurance_type: "Automotor", category: "auto", coverage: "todo_riesgo", domain: "AB123CD", description: "x" },
    ]);
    const res = await GET(makeReq("/api/chatbot/policies?phone=5491112345678"));
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].policy_number).toBe("AUTO-1001");
  });
});
