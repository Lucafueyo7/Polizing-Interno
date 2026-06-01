import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/chatbot/services/clientes", () => ({
  findActiveByTelefono: vi.fn(),
}));

import { GET } from "@/app/api/chatbot/clients/by-phone/[phone]/route";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";

const ctx = (phone: string) => ({ params: Promise.resolve({ phone }) }) as any;

function makeReq(apiKey: string | null = "test-key") {
  return new Request("http://localhost/api/chatbot/clients/by-phone/5491112345678", {
    headers: apiKey ? { "x-api-key": apiKey } : {},
  }) as any;
}

describe("GET /api/chatbot/clients/by-phone/[phone]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sin api key → 401", async () => {
    const res = await GET(makeReq(null), ctx("5491112345678"));
    expect(res.status).toBe(401);
  });

  it("cliente no existe → 404", async () => {
    (findActiveByTelefono as any).mockResolvedValue(null);
    const res = await GET(makeReq(), ctx("5491112345678"));
    expect(res.status).toBe(404);
  });

  it("happy → 200 con shape", async () => {
    (findActiveByTelefono as any).mockResolvedValue({
      id: 1,
      full_name: "Juan Pérez",
      shape: { id: 1, phone: "5491112345678", full_name: "Juan Pérez", active: true },
    });
    const res = await GET(makeReq(), ctx("5491112345678"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: 1, phone: "5491112345678", full_name: "Juan Pérez", active: true });
  });

  it("500 si el service lanza", async () => {
    (findActiveByTelefono as any).mockRejectedValue(new Error("boom"));
    const res = await GET(makeReq(), ctx("5491112345678"));
    expect(res.status).toBe(500);
  });
});
