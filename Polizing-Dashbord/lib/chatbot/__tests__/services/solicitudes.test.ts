import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    solicitudes_polizas: { create: vi.fn(), count: vi.fn() },
    clientes: { findFirst: vi.fn() },
  },
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { createPolicyRequest } from "../../services/solicitudes";
import { revalidateTag } from "next/cache";

const validPayload = {
  phone: "5491112345678",
  insurance_type: "auto" as const,
  domain: "AB123CD",
  brand: "Renault",
  model: "Sandero",
  year: "2020",
  use: "particular" as const,
  notes: "",
};

describe("createPolicyRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea solicitud con cliente_id=null si phone no matchea", async () => {
    (prisma.clientes.findFirst as any).mockResolvedValue(null);
    (prisma.solicitudes_polizas.count as any).mockResolvedValue(0);
    (prisma.solicitudes_polizas.create as any).mockImplementation((args: any) => ({
      id: 1,
      numero: args.data.numero,
      cliente_id: args.data.cliente_id,
    }));
    const out = await createPolicyRequest(validPayload);
    const year = new Date().getFullYear();
    expect(out.reference).toBe(`SOL-${year}-0001`);
    expect(out.cliente_id).toBeNull();
    expect(revalidateTag).toHaveBeenCalledWith("solicitudes", "minutes");
  });

  it("vincula cliente_id si el teléfono existe", async () => {
    (prisma.clientes.findFirst as any).mockResolvedValue({
      id: 5,
      telefono: "5491112345678",
      tipo: "persona",
      clientes_corporativos: null,
      clientes_no_corporativos: { nombre: "Juan", apellido: "Pérez" },
    });
    (prisma.solicitudes_polizas.count as any).mockResolvedValue(3);
    (prisma.solicitudes_polizas.create as any).mockImplementation((args: any) => ({
      id: 4,
      numero: args.data.numero,
      cliente_id: args.data.cliente_id,
    }));
    const out = await createPolicyRequest(validPayload);
    const year = new Date().getFullYear();
    expect(out.reference).toBe(`SOL-${year}-0004`);
    expect(out.cliente_id).toBe(5);
  });
});
