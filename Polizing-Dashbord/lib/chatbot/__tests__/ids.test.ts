import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    solicitudes_polizas: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { buildPayReference, nextSolicitudNumero } from "../ids";

describe("buildPayReference", () => {
  it("padea 5 dígitos", () => {
    expect(buildPayReference(1)).toBe("PAY-00001");
    expect(buildPayReference(123)).toBe("PAY-00123");
    expect(buildPayReference(99999)).toBe("PAY-99999");
  });

  it("admite ids más grandes que 5 dígitos sin truncar", () => {
    expect(buildPayReference(123456)).toBe("PAY-123456");
  });
});

describe("nextSolicitudNumero", () => {
  it("genera SOL-YYYY-NNNN incremental", async () => {
    (prisma.solicitudes_polizas.count as any).mockResolvedValue(7);
    const num = await nextSolicitudNumero();
    const year = new Date().getFullYear();
    expect(num).toBe(`SOL-${year}-0008`);
  });

  it("arranca en 0001 si es la primera del año", async () => {
    (prisma.solicitudes_polizas.count as any).mockResolvedValue(0);
    const num = await nextSolicitudNumero();
    const year = new Date().getFullYear();
    expect(num).toBe(`SOL-${year}-0001`);
  });
});
