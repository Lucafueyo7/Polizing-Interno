import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/chatbot/services/clientes", () => ({
  findActiveByTelefono: vi.fn(),
}));
vi.mock("@/lib/chatbot/services/polizas", () => ({
  getOwnedById: vi.fn(),
}));
vi.mock("@/lib/chatbot/services/siniestros", () => ({
  createWithDocuments: vi.fn(),
}));

import { POST } from "@/app/api/chatbot/claims/route";
import { findActiveByTelefono } from "@/lib/chatbot/services/clientes";
import { getOwnedById } from "@/lib/chatbot/services/polizas";
import { createWithDocuments } from "@/lib/chatbot/services/siniestros";

const b64 = (s: string) => Buffer.from(s).toString("base64");
const file = (name: string, mime = "image/jpeg") => ({
  filename: name,
  mime_type: mime,
  content_base64: b64(name),
});
const validBody = {
  phone: "5491112345678",
  policy: { id: 7 },
  date: "10/05/2026",
  time: "14:30",
  place: "Av Corrientes",
  description: "Choque trasero",
  third_parties: "NO",
  driver_license: file("dl.jpg"),
  vehicle_card: file("vc.jpg"),
  police_report: null,
  additional_files: [file("foto.jpg")],
};

function makeReq(body: unknown, apiKey: string | null = "test-key") {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;
  return new Request("http://localhost/api/chatbot/claims", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }) as any;
}

describe("POST /api/chatbot/claims", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sin api key → 401", async () => {
    const res = await POST(makeReq(validBody, null));
    expect(res.status).toBe(401);
  });

  it("date mal formateado → 422", async () => {
    const res = await POST(makeReq({ ...validBody, date: "2026-05-10" }));
    expect(res.status).toBe(422);
  });

  it("falta driver_license → 422", async () => {
    const { driver_license, ...rest } = validBody;
    const res = await POST(makeReq(rest));
    expect(res.status).toBe(422);
  });

  it("cliente no existe → 404", async () => {
    (findActiveByTelefono as any).mockResolvedValue(null);
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(404);
  });

  it("happy con police_report null → 201", async () => {
    (findActiveByTelefono as any).mockResolvedValue({ id: 1 });
    (getOwnedById as any).mockResolvedValue({ id: 7, policy_number: "AUTO-1001" });
    (createWithDocuments as any).mockResolvedValue({ reference: "SIN-2026-0001", status: "ok" });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ reference: "SIN-2026-0001", status: "ok" });
  });

  it("happy con police_report y N additional → 201", async () => {
    (findActiveByTelefono as any).mockResolvedValue({ id: 1 });
    (getOwnedById as any).mockResolvedValue({ id: 7, policy_number: "AUTO-1001" });
    (createWithDocuments as any).mockResolvedValue({ reference: "SIN-2026-0002", status: "ok" });
    const res = await POST(
      makeReq({
        ...validBody,
        police_report: file("acta.pdf", "application/pdf"),
        additional_files: [file("foto1.jpg"), file("foto2.jpg"), file("foto3.jpg")],
      }),
    );
    expect(res.status).toBe(201);
  });
});
