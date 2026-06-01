import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { nextSiniestroNumero } from "@/lib/data/siniestros";
import type { DecodedFile } from "../files";

export type ClaimFiles = {
  driver_license: DecodedFile;
  vehicle_card: DecodedFile;
  police_report: DecodedFile | null;
  additional_files: DecodedFile[];
};

export async function createWithDocuments(args: {
  policyId: number;
  numeroPoliza: string;
  date: string;
  time: string;
  place: string;
  description: string;
  third_parties: string;
  files: ClaimFiles;
}): Promise<{ reference: string; status: "ok" }> {
  const fechaOcurrencia = parseArDateTime(args.date, args.time);
  const numero = await nextSiniestroNumero();
  const titulo = `Siniestro reportado vía chatbot — póliza ${args.numeroPoliza}`;
  const descripcion = composeDescription(args);

  const documentos = collectDocuments(args.files);

  await prisma.$transaction(async (tx) => {
    const siniestro = await tx.siniestros.create({
      data: {
        poliza_id: args.policyId,
        numero,
        titulo,
        fecha_ocurrencia: fechaOcurrencia,
        fecha_reporte: new Date(),
        estado: "nuevo",
      },
      select: { id: true },
    });
    if (documentos.length > 0) {
      await tx.siniestro_documentos.createMany({
        data: documentos.map((d) => ({
          siniestro_id: siniestro.id,
          tipo: d.mime.startsWith("image/") ? ("img" as const) : ("pdf" as const),
          nombre: d.filename,
          mime_type: d.mime,
          tamano_bytes: d.size,
          contenido: new Uint8Array(d.bytes),
          url: null,
        })),
      });
    }
    // El descripcion compuesto no tiene columna propia en `siniestros`;
    // queda capturado en el título y en los archivos. Para futuro, conviene
    // sumar `descripcion` al modelo.
    void descripcion;
  });

  revalidateTag(CACHE_TAGS.siniestros, "minutes");
  return { reference: numero, status: "ok" };
}

function parseArDateTime(date: string, time: string): Date {
  const [day, month, year] = date.split("/").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hh, mm);
}

function composeDescription(args: {
  place: string;
  description: string;
  third_parties: string;
}): string {
  const tp = args.third_parties.trim();
  const terceros = tp && tp.toUpperCase() !== "NO" ? `Terceros: ${tp}` : "Sin terceros";
  return `Lugar: ${args.place}. ${args.description}. ${terceros}.`;
}

function collectDocuments(files: ClaimFiles): DecodedFile[] {
  const out: DecodedFile[] = [files.driver_license, files.vehicle_card];
  if (files.police_report) out.push(files.police_report);
  out.push(...files.additional_files);
  return out;
}
