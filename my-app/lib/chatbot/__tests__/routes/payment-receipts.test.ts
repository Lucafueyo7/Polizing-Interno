import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/chatbot/services/clientes", () => ({
  findActiveByTelefono: vi.fn(),
}));
vi.mock("@/lib/chatbot/services/polizas", () => ({
  getOwnedById: vi.fn(),
}));
vi.mock("@/lib/chatbot/services/pagos", () => ({
  createFromReceipt: vi.fn(),
}));

import { POST } from "@/app/api/chatbot/payment-receipts/route";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";
import { getOwnedById } from "@/lib/chatbot/services/polizas";
import { createFromReceipt } from "@/lib/chatbot/services/pagos";

const b64 = (s: string) => Buffer.from(s).toString("base64");
const file = {
  filename: "r.pdf",
  mime_type: "application/pdf",
  content_base64: b64("hola"),
};
const validBody = {
  phone: "5491112345678",
  policy: { id: 7 },
  file,
};

function makeReq(body: unknown, apiKey: string | null = "test-key") {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;
  return new Request("http://localhost/api/chatbot/payment-receipts", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }) as any;
}

describe("POST /api/chatbot/payment-receipts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sin api key → 401", async () => {
    const res = await POST(makeReq(validBody, null));
    expect(res.status).toBe(401);
  });

  it("base64 inválido → 422", async () => {
    const res = await POST(
      makeReq({ ...validBody, file: { ...file, content_base64: "no!!!" } }),
    );
    expect(res.status).toBe(422);
  });

  it("mime no permitido → 422", async () => {
    (findActiveByTelefono as any).mockResolvedValue({ id: 1 });
    (getOwnedById as any).mockResolvedValue({ id: 7, policy_number: "AUTO-1001" });
    const res = await POST(
      makeReq({ ...validBody, file: { ...file, mime_type: "application/x-msdownload" } }),
    );
    expect(res.status).toBe(422);
  });

  it("cliente no existe → 404", async () => {
    (findActiveByTelefono as any).mockResolvedValue(null);
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(404);
  });

  it("póliza no es del cliente → 404", async () => {
    (findActiveByTelefono as any).mockResolvedValue({ id: 1 });
    (getOwnedById as any).mockResolvedValue(null);
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(404);
  });

  it("happy → 201 con reference", async () => {
    (findActiveByTelefono as any).mockResolvedValue({ id: 1 });
    (getOwnedById as any).mockResolvedValue({ id: 7, policy_number: "AUTO-1001" });
    (createFromReceipt as any).mockResolvedValue({ reference: "PAY-00042", status: "ok" });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ reference: "PAY-00042", status: "ok" });
  });
});
