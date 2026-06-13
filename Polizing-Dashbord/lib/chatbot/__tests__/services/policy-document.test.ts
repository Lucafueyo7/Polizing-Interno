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
import { refreshAndGetPolicyDoc } from "../../services/policy-document";

const makeProvider = (overrides: Partial<any> = {}) => ({
  supports: () => true,
  generateDocuments: vi.fn().mockResolvedValue([
    { source_url: "https://berkley.example/poliza.pdf", filename: "poliza.pdf", mime_type: "application/pdf" },
  ]),
  ...overrides,
});

const polizaRow = {
  id: 7,
  numero_poliza: "9054704",
  rama: "04",
  suplemento: 0,
  aseguradora_id: 6,
  poliza_pdf: null,
  raw_berkley: { rama: "04", poliza: "9054704" },
};

describe("refreshAndGetPolicyDoc", () => {
  beforeEach(() => vi.clearAllMocks());

  it("null si póliza no existe o no es del cliente", async () => {
    (prisma.polizas.findFirst as any).mockResolvedValue(null);
    expect(await refreshAndGetPolicyDoc(1, 7)).toBeNull();
  });

  it("happy: pide CopiaPoliza a Berkley, cachea el link y devuelve mode=link", async () => {
    (prisma.polizas.findFirst as any).mockResolvedValue(polizaRow);
    const provider = makeProvider();
    (getProviderForAseguradora as any).mockResolvedValue(provider);

    const out = await refreshAndGetPolicyDoc(1, 7);
    expect(out).toEqual({
      mode: "link",
      source_url: "https://berkley.example/poliza.pdf",
      filename: "poliza.pdf",
      mime_type: "application/pdf",
    });
    expect(provider.generateDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ documentos: ["poliza"] }),
    );
    expect(prisma.polizas.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { poliza_pdf: "https://berkley.example/poliza.pdf", poliza_mime: "application/pdf" },
    });
  });

  it("Berkley falla pero hay link cacheado → devuelve el cacheado", async () => {
    (prisma.polizas.findFirst as any).mockResolvedValue({
      ...polizaRow,
      poliza_pdf: "https://berkley.example/cached.pdf",
    });
    (getProviderForAseguradora as any).mockResolvedValue(
      makeProvider({ generateDocuments: vi.fn().mockRejectedValue(new Error("Berkley caído")) }),
    );

    const out = await refreshAndGetPolicyDoc(1, 7);
    expect(out).toEqual({
      mode: "link",
      source_url: "https://berkley.example/cached.pdf",
      filename: "poliza-9054704.pdf",
      mime_type: "application/pdf",
    });
  });

  it("Berkley falla y no hay caché → null", async () => {
    (prisma.polizas.findFirst as any).mockResolvedValue(polizaRow);
    (getProviderForAseguradora as any).mockResolvedValue(
      makeProvider({ generateDocuments: vi.fn().mockRejectedValue(new Error("Berkley caído")) }),
    );

    expect(await refreshAndGetPolicyDoc(1, 7)).toBeNull();
  });
});
