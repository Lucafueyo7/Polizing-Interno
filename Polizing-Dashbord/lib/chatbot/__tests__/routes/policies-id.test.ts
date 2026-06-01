import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/chatbot/services/clientes", () => ({
  findActiveByTelefono: vi.fn(),
}));
vi.mock("@/lib/chatbot/services/polizas", () => ({
  getOwnedById: vi.fn(),
}));

import { GET } from "@/app/api/chatbot/policies/[policyId]/route";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";
import { getOwnedById } from "@/lib/chatbot/services/polizas";

const NextRequest = require("next/server").NextRequest;
const ctx = (policyId: string) => ({ params: Promise.resolve({ policyId }) }) as any;

function makeReq(url: string, apiKey: string | null = "test-key") {
  const headers = apiKey ? { "x-api-key": apiKey } : {};
  return new NextRequest(`http://localhost${url}`, { headers });
}

describe("GET /api/chatbot/policies/[policyId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("policyId inválido → 422", async () => {
    const res = await GET(makeReq("/api/chatbot/policies/abc?phone=5491112345678"), ctx("abc"));
    expect(res.status).toBe(422);
  });

  it("ownership violation → 404", async () => {
    (findActiveByTelefono as any).mockResolvedValue({ id: 1 });
    (getOwnedById as any).mockResolvedValue(null);
    const res = await GET(makeReq("/api/chatbot/policies/7?phone=5491112345678"), ctx("7"));
    expect(res.status).toBe(404);
  });

  it("happy → 200 con shape", async () => {
    (findActiveByTelefono as any).mockResolvedValue({ id: 1 });
    (getOwnedById as any).mockResolvedValue({ id: 7, policy_number: "AUTO-1001" });
    const res = await GET(makeReq("/api/chatbot/policies/7?phone=5491112345678"), ctx("7"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(7);
  });
});
