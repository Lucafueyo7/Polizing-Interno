import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/chatbot/services/solicitudes", () => ({
  createPolicyRequest: vi.fn(),
}));

import { POST } from "@/app/api/chatbot/policy-requests/route";
import { createPolicyRequest } from "@/lib/chatbot/services/solicitudes";

const validBody = {
  phone: "5491112345678",
  insurance_type: "auto",
  domain: "AB123CD",
  brand: "Renault",
  model: "Sandero",
  year: "2020",
  use: "particular",
  notes: "",
};

function makeReq(body: unknown, apiKey: string | null = "test-key") {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;
  return new Request("http://localhost/api/chatbot/policy-requests", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }) as any;
}

describe("POST /api/chatbot/policy-requests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sin api key → 401", async () => {
    const res = await POST(makeReq(validBody, null));
    expect(res.status).toBe(401);
  });

  it("year mal formateado → 422", async () => {
    const res = await POST(makeReq({ ...validBody, year: "20" }));
    expect(res.status).toBe(422);
  });

  it("use fuera de enum → 422", async () => {
    const res = await POST(makeReq({ ...validBody, use: "otra" }));
    expect(res.status).toBe(422);
  });

  it("insurance_type fuera de enum → 422", async () => {
    const res = await POST(makeReq({ ...validBody, insurance_type: "vida" }));
    expect(res.status).toBe(422);
  });

  it("happy → 201 con reference SOL-YYYY-NNNN", async () => {
    (createPolicyRequest as any).mockResolvedValue({
      reference: "SOL-2026-0001",
      status: "ok",
      cliente_id: null,
    });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ reference: "SOL-2026-0001", status: "ok" });
  });
});
