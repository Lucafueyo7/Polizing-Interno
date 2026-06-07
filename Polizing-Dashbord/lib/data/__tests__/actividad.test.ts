import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    siniestros: { findMany: vi.fn() },
    polizas: { findMany: vi.fn() },
    pagos: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getActividadReciente } from "../actividad";

describe("getActividadReciente", () => {
  beforeEach(() => vi.clearAllMocks());

  it("combina siniestros, pólizas y pagos y los ordena por fecha desc", async () => {
    const now = new Date("2026-06-07T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    (prisma.siniestros.findMany as any).mockResolvedValue([
      {
        id: 1,
        titulo: "Siniestro B",
        fecha_reporte: new Date("2026-06-07T09:00:00.000Z"),
        poliza: {
          cliente: { clientes_corporativos: null, clientes_no_corporativos: { nombre: "Ana", apellido: "Lopez" } },
        },
      },
    ]);
    (prisma.polizas.findMany as any).mockResolvedValue([
      {
        id: 2,
        numero_poliza: "P-22",
        estado: "vigente",
        created_at: new Date("2026-06-07T11:00:00.000Z"),
        cliente: {
          clientes_corporativos: { razon_social: "ACME SA" },
          clientes_no_corporativos: null,
        },
      },
    ]);
    (prisma.pagos.findMany as any).mockResolvedValue([
      {
        id: 3,
        numero_recibo: "R-9",
        importe: 125000,
        created_at: new Date("2026-06-07T10:30:00.000Z"),
        cliente: {
          clientes_corporativos: { razon_social: "Beta SRL" },
          clientes_no_corporativos: null,
        },
      },
    ]);

    const items = await getActividadReciente(3);

    expect(items).toHaveLength(3);
    expect(items.map((item) => item.type)).toEqual(["poliza", "pago", "siniestro"]);
    expect(items[0].title).toBe("Póliza P-22");
    expect(items[1].meta).toContain("Beta SRL");
    expect(items[2].when).toBe("hace 3 h");

    vi.useRealTimers();
  });
});
