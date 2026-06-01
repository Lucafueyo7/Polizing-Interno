import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    clientes: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { findActiveByTelefono } from "../../services/clientes";

describe("findActiveByTelefono", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devuelve null si no hay cliente activo", async () => {
    (prisma.clientes.findFirst as any).mockResolvedValue(null);
    const out = await findActiveByTelefono("5491100000000");
    expect(out).toBeNull();
  });

  it("mapea correctamente persona con apellido", async () => {
    (prisma.clientes.findFirst as any).mockResolvedValue({
      id: 5,
      telefono: "5491112345678",
      tipo: "persona",
      clientes_corporativos: null,
      clientes_no_corporativos: { nombre: "Juan", apellido: "Pérez" },
    });
    const out = await findActiveByTelefono("5491112345678");
    expect(out?.id).toBe(5);
    expect(out?.full_name).toBe("Juan Pérez");
    expect(out?.shape.active).toBe(true);
  });

  it("invoca prisma con filtro estado=activo y orderBy id asc", async () => {
    (prisma.clientes.findFirst as any).mockResolvedValue(null);
    await findActiveByTelefono("5491112345678");
    const call = (prisma.clientes.findFirst as any).mock.calls[0][0];
    expect(call.where).toEqual({ telefono: "5491112345678", estado: "activo" });
    expect(call.orderBy).toEqual({ id: "asc" });
  });
});
