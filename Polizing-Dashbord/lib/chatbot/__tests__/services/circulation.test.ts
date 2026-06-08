import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    polizas: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/insurers/registry", () => ({
  getProviderForAseguradora: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getProviderForAseguradora } from "@/lib/insurers/registry";
import { refreshAndGetCard } from "../../services/circulation";

const makeProvider = (overrides: Partial<any> = {}) => ({
  supports: () => true,
  generateDocuments: vi.fn().mockResolvedValue([
    { source_url: "https://berkley.example/tarjeta.pdf", filename: "tarjeta.pdf", mime_type: "application/pdf" },
  ]),
  ...overrides,
});

describe("refreshAndGetCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("null si póliza no existe o no es del cliente", async () => {
    (prisma.polizas.findFirst as any).mockResolvedValue(null);
    expect(await refreshAndGetCard(1, 7)).toBeNull();
  });

  it("happy: pide a Berkley, cachea el link y devuelve mode=link", async () => {
    (prisma.polizas.findFirst as any).mockResolvedValue({
      id: 7,
      numero_poliza: "9054704",
      rama: "04",
      suplemento: 0,
      aseguradora_id: 6,
      tarjeta_circulacion_pdf: null,
      raw_berkley: { rama: "04", poliza: "9054704" },
    });
    (getProviderForAseguradora as any).mockResolvedValue(makeProvider());

    const out = await refreshAndGetCard(1, 7);
    expect(out).toEqual({
      mode: "link",
      source_url: "https://berkley.example/tarjeta.pdf",
      filename: "tarjeta.pdf",
      mime_type: "application/pdf",
    });
    expect(prisma.polizas.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { tarjeta_circulacion_pdf: "https://berkley.example/tarjeta.pdf", tarjeta_circulacion_mime: "application/pdf" },
    });
  });

  it("Berkley falla pero hay link cacheado → devuelve el cacheado", async () => {
    (prisma.polizas.findFirst as any).mockResolvedValue({
      id: 7,
      numero_poliza: "9054704",
      rama: "04",
      suplemento: 0,
      aseguradora_id: 6,
      tarjeta_circulacion_pdf: "https://berkley.example/cached.pdf",
      raw_berkley: { rama: "04", poliza: "9054704" },
    });
    (getProviderForAseguradora as any).mockResolvedValue(
      makeProvider({ generateDocuments: vi.fn().mockRejectedValue(new Error("Berkley caído")) }),
    );

    const out = await refreshAndGetCard(1, 7);
    expect(out).toEqual({
      mode: "link",
      source_url: "https://berkley.example/cached.pdf",
      filename: "tarjeta-9054704.pdf",
      mime_type: "application/pdf",
    });
  });

  it("Berkley falla y no hay caché → null", async () => {
    (prisma.polizas.findFirst as any).mockResolvedValue({
      id: 7,
      numero_poliza: "9054704",
      rama: "04",
      suplemento: 0,
      aseguradora_id: 6,
      tarjeta_circulacion_pdf: null,
      raw_berkley: { rama: "04", poliza: "9054704" },
    });
    (getProviderForAseguradora as any).mockResolvedValue(
      makeProvider({ generateDocuments: vi.fn().mockRejectedValue(new Error("Berkley caído")) }),
    );

    expect(await refreshAndGetCard(1, 7)).toBeNull();
  });
});
