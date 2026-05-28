import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { polizas: { findFirst: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { getCard } from "../../services/circulation";

describe("getCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("null si póliza no existe o no es del cliente", async () => {
    (prisma.polizas.findFirst as any).mockResolvedValue(null);
    expect(await getCard(1, 7)).toBeNull();
  });

  it("null si la póliza no tiene tarjeta cargada", async () => {
    (prisma.polizas.findFirst as any).mockResolvedValue({
      numero_poliza: "AUTO-1001",
      tarjeta_circulacion_pdf: null,
      tarjeta_circulacion_mime: null,
    });
    expect(await getCard(1, 7)).toBeNull();
  });

  it("devuelve content_base64 y filename basado en numero_poliza", async () => {
    const bytes = Buffer.from("PDF FAKE", "utf8");
    (prisma.polizas.findFirst as any).mockResolvedValue({
      numero_poliza: "AUTO-1001",
      tarjeta_circulacion_pdf: bytes,
      tarjeta_circulacion_mime: "application/pdf",
    });
    const out = await getCard(1, 7);
    expect(out?.filename).toBe("tarjeta-AUTO-1001.pdf");
    expect(out?.mime_type).toBe("application/pdf");
    expect(Buffer.from(out!.content_base64, "base64").toString()).toBe("PDF FAKE");
  });
});
