import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    clientes: { findMany: vi.fn(), findUnique: vi.fn() },
    siniestros: { count: vi.fn() },
    polizas: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getClientes } from "../clientes";

describe("getClientes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filtra por aseguradora y respeta sorting por label asc/desc", async () => {
    (prisma.clientes.findMany as any).mockResolvedValue([
      {
        id: 1,
        tipo: "corporativo",
        clientes_corporativos: { razon_social: "Zeta SA", cuit: "30-1" },
        clientes_no_corporativos: null,
        email: "zeta@acme.com",
        telefono: null,
        estado: "activo",
        fecha_alta: new Date("2026-01-01T00:00:00.000Z"),
        polizas: [
          { estado: "vigente", prima_mensual: 100, aseguradora_id: 10 },
          { estado: "vigente", prima_mensual: 200, aseguradora_id: 20 },
        ],
      },
      {
        id: 2,
        tipo: "corporativo",
        clientes_corporativos: { razon_social: "Alpha SA", cuit: "30-2" },
        clientes_no_corporativos: null,
        email: "alpha@acme.com",
        telefono: null,
        estado: "activo",
        fecha_alta: new Date("2026-01-02T00:00:00.000Z"),
        polizas: [{ estado: "vigente", prima_mensual: 50, aseguradora_id: 10 }],
      },
      {
        id: 3,
        tipo: "persona",
        clientes_corporativos: null,
        clientes_no_corporativos: { nombre: "Carlos", apellido: "Diaz", dni: "123" },
        email: "carlos@acme.com",
        telefono: null,
        estado: "baja",
        fecha_alta: new Date("2026-01-03T00:00:00.000Z"),
        polizas: [{ estado: "vigente", prima_mensual: 70, aseguradora_id: 20 }],
      },
    ]);

    const filtered = await getClientes({ aseguradoraId: "10", sortBy: "label", sortDir: "asc" });
    expect(filtered.rows.map((row) => row.label)).toEqual(["Alpha SA", "Zeta SA"]);
    expect(filtered.total).toBe(2);

    const sortedDesc = await getClientes({ sortBy: "label", sortDir: "desc" });
    expect(sortedDesc.rows.map((row) => row.label)).toEqual(["Zeta SA", "Carlos Diaz", "Alpha SA"]);
  });

  it("ordena por pólizas y prima y mantiene la paginación", async () => {
    (prisma.clientes.findMany as any).mockResolvedValue([
      {
        id: 1,
        tipo: "corporativo",
        clientes_corporativos: { razon_social: "A", cuit: "30-1" },
        clientes_no_corporativos: null,
        email: null,
        telefono: null,
        estado: "activo",
        fecha_alta: new Date("2026-01-01T00:00:00.000Z"),
        polizas: [{ estado: "vigente", prima_mensual: 300, aseguradora_id: 10 }],
      },
      {
        id: 2,
        tipo: "corporativo",
        clientes_corporativos: { razon_social: "B", cuit: "30-2" },
        clientes_no_corporativos: null,
        email: null,
        telefono: null,
        estado: "activo",
        fecha_alta: new Date("2026-01-02T00:00:00.000Z"),
        polizas: [
          { estado: "vigente", prima_mensual: 100, aseguradora_id: 10 },
          { estado: "vigente", prima_mensual: 100, aseguradora_id: 10 },
        ],
      },
      {
        id: 3,
        tipo: "corporativo",
        clientes_corporativos: { razon_social: "C", cuit: "30-3" },
        clientes_no_corporativos: null,
        email: null,
        telefono: null,
        estado: "activo",
        fecha_alta: new Date("2026-01-03T00:00:00.000Z"),
        polizas: [],
      },
    ]);

    const byPolizas = await getClientes({ sortBy: "polizas", sortDir: "desc" }, 0);
    expect(byPolizas.rows.map((row) => row.id)).toEqual([2, 1, 3]);

    const byPrima = await getClientes({ sortBy: "prima", sortDir: "desc" }, 0);
    expect(byPrima.rows.map((row) => row.id)).toEqual([1, 2, 3]);
  });
});
