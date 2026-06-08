import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/chatbot/services/clientes", () => ({
  findActiveByTelefono: vi.fn(),
}));
vi.mock("@/lib/chatbot/services/circulation", () => ({ refreshAndGetCard: vi.fn() }));

import { POST } from "@/app/api/chatbot/circulation-card/route";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";
import { refreshAndGetCard } from "@/lib/chatbot/services/circulation";

function makeReq(body: unknown, apiKey: string | null = "test-key") {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;
  return new Request("http://localhost/api/chatbot/circulation-card", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }) as any;
}

describe("POST /api/chatbot/circulation-card", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sin api key → 401", async () => {
    const res = await POST(makeReq({ phone: "5491112345678", policy_id: 7 }, null));
    expect(res.status).toBe(401);
  });

  it("body inválido → 422", async () => {
    const res = await POST(makeReq({ phone: "abc", policy_id: 0 }));
    expect(res.status).toBe(422);
  });

  it("cliente no existe → 404", async () => {
    (findActiveByTelefono as any).mockResolvedValue(null);
    const res = await POST(makeReq({ phone: "5491112345678", policy_id: 7 }));
    expect(res.status).toBe(404);
  });

  it("tarjeta no disponible → 404", async () => {
    (findActiveByTelefono as any).mockResolvedValue({ id: 1 });
    (refreshAndGetCard as any).mockResolvedValue(null);
    const res = await POST(makeReq({ phone: "5491112345678", policy_id: 7 }));
    expect(res.status).toBe(404);
  });

  it("happy → 200 con link", async () => {
    (findActiveByTelefono as any).mockResolvedValue({ id: 1 });
    (refreshAndGetCard as any).mockResolvedValue({
      mode: "link",
      source_url: "https://berkley.example/tarjeta.pdf",
      filename: "tarjeta-9054704.pdf",
      mime_type: "application/pdf",
    });
    const res = await POST(makeReq({ phone: "5491112345678", policy_id: 7 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("link");
    expect(body.source_url).toBe("https://berkley.example/tarjeta.pdf");
  });
});
