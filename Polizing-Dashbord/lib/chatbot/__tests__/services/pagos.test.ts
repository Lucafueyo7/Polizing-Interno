import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = {
  pagos: { create: vi.fn() },
  polizas: { update: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((cb: any) => cb(tx)),
  },
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import { createFromReceipt } from "../../services/pagos";
import { revalidateTag } from "next/cache";

const file = { bytes: Buffer.from("data"), size: 4, mime: "application/pdf", filename: "r.pdf" };

describe("createFromReceipt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tx.pagos.create.mockReset();
    tx.polizas.update.mockReset();
  });

  it("crea pago con monto=0 estado=pendiente y vincula póliza", async () => {
    tx.pagos.create.mockResolvedValue({ id: 42 });
    tx.polizas.update.mockResolvedValue({});
    const out = await createFromReceipt({ clienteId: 1, policyId: 7, file });
    expect(out).toEqual({ reference: "PAY-00042", status: "ok" });
    const call = (tx.pagos.create as any).mock.calls[0][0];
    expect(call.data.cliente_id).toBe(1);
    expect(call.data.monto).toBe(0);
    expect(call.data.estado).toBe("pendiente");
    expect(call.data.comprobante_nombre).toBe("r.pdf");
    expect(call.data.comprobante_mime).toBe("application/pdf");
    expect(Buffer.from(call.data.comprobante_contenido).toString()).toBe("data");
    expect(call.select).toEqual({ id: true });
    expect(tx.polizas.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { pago_id: 42 },
    });
    expect(revalidateTag).toHaveBeenCalledWith("pagos", "minutes");
    expect(revalidateTag).toHaveBeenCalledWith("polizas", "minutes");
  });
});
