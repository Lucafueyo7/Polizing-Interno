import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    polizas: { findMany: vi.fn(), findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { listVigentesByClienteId, getOwnedById } from "../../services/polizas";

const polizaRow = {
  id: 7,
  numero_poliza: "AUTO-1001",
  dominio: "AB123CD",
  tipo_seguro: { nombre: "Automotor", categoria: "auto" },
  cobertura: { nombre: "todo_riesgo" },
  aseguradora: { razon_social: "La Caja" },
};

describe("listVigentesByClienteId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filtra por estado vigente, categoría auto, y ordena por dominio", async () => {
    (prisma.polizas.findMany as any).mockResolvedValue([polizaRow]);
    const out = await listVigentesByClienteId(1);
    expect(out).toHaveLength(1);
    expect(out[0].policy_number).toBe("AUTO-1001");
    expect(out[0].category).toBe("auto");
    expect(out[0].coverage).toBe("todo_riesgo");
    const call = (prisma.polizas.findMany as any).mock.calls[0][0];
    expect(call.where.cliente_id).toBe(1);
    expect(call.where.estado).toEqual({ in: ["vigente"] });
    expect(call.where.tipo_seguro).toEqual({ categoria: "auto" });
    expect(call.orderBy).toEqual({ dominio: "asc" });
  });

  it("devuelve [] si no hay pólizas", async () => {
    (prisma.polizas.findMany as any).mockResolvedValue([]);
    expect(await listVigentesByClienteId(99)).toEqual([]);
  });
});

describe("getOwnedById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devuelve null si no matchea (ownership)", async () => {
    (prisma.polizas.findFirst as any).mockResolvedValue(null);
    expect(await getOwnedById(1, 99)).toBeNull();
  });

  it("happy", async () => {
    (prisma.polizas.findFirst as any).mockResolvedValue(polizaRow);
    const out = await getOwnedById(1, 7);
    expect(out?.id).toBe(7);
    expect(out?.domain).toBe("AB123CD");
  });

  it("incluye cliente_id en el where", async () => {
    (prisma.polizas.findFirst as any).mockResolvedValue(null);
    await getOwnedById(42, 7);
    const call = (prisma.polizas.findFirst as any).mock.calls[0][0];
    expect(call.where).toEqual({
      id: 7,
      cliente_id: 42,
      estado: { in: ["vigente"] },
    });
  });
});
