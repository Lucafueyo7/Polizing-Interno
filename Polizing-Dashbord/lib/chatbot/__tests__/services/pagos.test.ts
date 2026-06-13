import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = {
  pagos: { create: vi.fn() },
  pago_documentos: { createMany: vi.fn() },
  polizas: { updateMany: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((cb: any) => cb(tx)),
  },
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/storage/supabase", () => ({
  uploadPagoDoc: vi.fn(async (path: string) => path),
}));

import { createFromReceipts } from "../../services/pagos";
import { revalidateTag } from "next/cache";
import { uploadPagoDoc } from "@/lib/storage/supabase";

const pdf = { bytes: Buffer.from("data"), size: 4, mime: "application/pdf", filename: "r.pdf" };
const img = { bytes: Buffer.from("img"), size: 3, mime: "image/png", filename: "foto.png" };

describe("createFromReceipts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tx.pagos.create.mockResolvedValue({ id: 42 });
    tx.pago_documentos.createMany.mockResolvedValue({});
    tx.polizas.updateMany.mockResolvedValue({});
  });

  it("sube los archivos, crea el pago, los documentos y vincula varias pólizas", async () => {
    const out = await createFromReceipts({
      clienteId: 1,
      policyIds: [7, 8],
      files: [pdf, img],
    });
    expect(out).toEqual({ reference: "PAY-00042", status: "ok" });

    expect(uploadPagoDoc).toHaveBeenCalledTimes(2);

    const pagoCall = (tx.pagos.create as any).mock.calls[0][0];
    expect(pagoCall.data).toEqual({ cliente_id: 1, monto: 0, estado: "pendiente" });

    const docsCall = (tx.pago_documentos.createMany as any).mock.calls[0][0];
    expect(docsCall.data).toHaveLength(2);
    expect(docsCall.data[0]).toMatchObject({ pago_id: 42, tipo: "pdf", nombre: "r.pdf" });
    expect(docsCall.data[1]).toMatchObject({ pago_id: 42, tipo: "img", nombre: "foto.png" });

    expect(tx.polizas.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [7, 8] } },
      data: { pago_id: 42 },
    });
    expect(revalidateTag).toHaveBeenCalledWith("pagos", "minutes");
    expect(revalidateTag).toHaveBeenCalledWith("polizas", "minutes");
  });
});
