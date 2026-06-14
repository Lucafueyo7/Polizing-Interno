import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    empresas_aseguradoras: { findMany: vi.fn() },
    siniestros: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getDistribucionAseguradoras, getSidebarBadges } from "../kpis";

describe("data functions with next/cache mocked", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("getDistribucionAseguradoras", () => {
    it("distribuye porcentajes según pólizas activas por aseguradora", async () => {
      (prisma.empresas_aseguradoras.findMany as any).mockResolvedValue([
        {
          id: 1,
          razon_social: "Aseguradora A",
          polizas: [{ estado: "vigente" }, { estado: "vigente" }],
        },
        {
          id: 2,
          razon_social: "Aseguradora B",
          polizas: [{ estado: "vigente" }],
        },
        {
          id: 3,
          razon_social: "Aseguradora C",
          polizas: [{ estado: "cancelada" }],
        },
      ]);

      const result = await getDistribucionAseguradoras();

      expect(result).toHaveLength(3);
      // totalActivas = 3 (2+1+0), denom = 3
      expect(result[0]).toMatchObject({
        id: 1,
        razonSocial: "Aseguradora A",
        polizasActivas: 2,
        color: "#0f2744",
      });
      expect(result[0].pct).toBeCloseTo(66.67, 1);
      expect(result[1]).toMatchObject({
        id: 2,
        razonSocial: "Aseguradora B",
        polizasActivas: 1,
        color: "#0d8a5f",
      });
      expect(result[1].pct).toBeCloseTo(33.33, 1);
      expect(result[2]).toMatchObject({
        id: 3,
        razonSocial: "Aseguradora C",
        polizasActivas: 0,
        color: "#b6620a",
      });
      expect(result[2].pct).toBe(0);
    });

    it("retorna arreglo vacío cuando no hay aseguradoras", async () => {
      (prisma.empresas_aseguradoras.findMany as any).mockResolvedValue([]);

      const result = await getDistribucionAseguradoras();

      expect(result).toEqual([]);
    });
  });

  describe("getSidebarBadges", () => {
    it("retorna la cantidad de siniestros nuevos", async () => {
      (prisma.siniestros.count as any).mockResolvedValue(3);

      const result = await getSidebarBadges();

      expect(result).toEqual({ siniestrosNuevos: 3 });
      expect(prisma.siniestros.count).toHaveBeenCalledWith({
        where: { estado: "nuevo" },
      });
    });
  });
});
