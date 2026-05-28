import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = {
  siniestros: { create: vi.fn() },
  siniestro_documentos: { createMany: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: vi.fn((cb: any) => cb(tx)) },
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/data/siniestros", () => ({
  nextSiniestroNumero: vi.fn().mockResolvedValue("SIN-2026-0001"),
}));

import { createWithDocuments } from "../../services/siniestros";
import { revalidateTag } from "next/cache";

const file = (name: string, mime = "image/jpeg") => ({
  bytes: Buffer.from(name),
  size: name.length,
  mime,
  filename: name,
});

describe("createWithDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tx.siniestros.create.mockReset();
    tx.siniestro_documentos.createMany.mockReset();
  });

  it("crea siniestro con numero generado + documentos en TX", async () => {
    tx.siniestros.create.mockResolvedValue({ id: 99 });
    tx.siniestro_documentos.createMany.mockResolvedValue({ count: 3 });
    const out = await createWithDocuments({
      policyId: 7,
      numeroPoliza: "AUTO-1001",
      date: "10/05/2026",
      time: "14:30",
      place: "Av Corrientes",
      description: "Choque trasero",
      third_parties: "NO",
      files: {
        driver_license: file("dl.jpg"),
        vehicle_card: file("vc.jpg"),
        police_report: null,
        additional_files: [file("foto.jpg")],
      },
    });
    expect(out).toEqual({ reference: "SIN-2026-0001", status: "ok" });
    expect(tx.siniestros.create).toHaveBeenCalled();
    const created = tx.siniestros.create.mock.calls[0][0];
    expect(created.data.numero).toBe("SIN-2026-0001");
    expect(created.data.poliza_id).toBe(7);
    expect(created.data.estado).toBe("nuevo");
    expect(created.data.fecha_ocurrencia).toEqual(new Date(2026, 4, 10, 14, 30));
    const docs = tx.siniestro_documentos.createMany.mock.calls[0][0].data;
    expect(docs).toHaveLength(3);
    expect(docs.every((d: any) => d.tipo === "img")).toBe(true);
    expect(docs.every((d: any) => d.contenido instanceof Uint8Array)).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith("siniestros", "minutes");
  });

  it("incluye police_report cuando viene presente", async () => {
    tx.siniestros.create.mockResolvedValue({ id: 100 });
    await createWithDocuments({
      policyId: 7,
      numeroPoliza: "AUTO-1001",
      date: "10/05/2026",
      time: "14:30",
      place: "x",
      description: "y",
      third_parties: "NO",
      files: {
        driver_license: file("dl.pdf", "application/pdf"),
        vehicle_card: file("vc.pdf", "application/pdf"),
        police_report: file("acta.pdf", "application/pdf"),
        additional_files: [],
      },
    });
    const docs = tx.siniestro_documentos.createMany.mock.calls[0][0].data;
    expect(docs).toHaveLength(3);
    expect(docs.every((d: any) => d.tipo === "pdf")).toBe(true);
  });

  it("no crea documentos cuando no hay archivos extra y solo los obligatorios", async () => {
    tx.siniestros.create.mockResolvedValue({ id: 101 });
    await createWithDocuments({
      policyId: 7,
      numeroPoliza: "AUTO-1001",
      date: "10/05/2026",
      time: "14:30",
      place: "x",
      description: "y",
      third_parties: "NO",
      files: {
        driver_license: file("dl.jpg"),
        vehicle_card: file("vc.jpg"),
        police_report: null,
        additional_files: [],
      },
    });
    const docs = tx.siniestro_documentos.createMany.mock.calls[0][0].data;
    expect(docs).toHaveLength(2);
  });
});
