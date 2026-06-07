import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { nextSiniestroNumero } from "@/lib/data/siniestros";
import { uploadSiniestroDoc } from "@/lib/storage/supabase";
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
  const descripcionTexto = composeDescription(args);

  const documentos = collectDocuments(args.files);

  // Subimos al bucket ANTES de la transacción: si falla una subida, abortamos
  // sin dejar el siniestro creado. El `numero` (ya generado) es la carpeta.
  const uploaded = await Promise.all(
    documentos.map(async (d, i) => ({
      doc: d,
      path: await uploadSiniestroDoc(
        `${numero}/${i}-${sanitizeFilename(d.filename)}`,
        new Uint8Array(d.bytes),
        d.mime,
      ),
    })),
  );

  await prisma.$transaction(async (tx) => {
    const siniestro = await tx.siniestros.create({
      data: {
        poliza_id: args.policyId,
        numero,
        titulo,
        descripcion: descripcionTexto,
        fecha_ocurrencia: fechaOcurrencia,
        fecha_reporte: new Date(),
        estado: "nuevo",
      },
      select: { id: true },
    });
    if (uploaded.length > 0) {
      await tx.siniestro_documentos.createMany({
        data: uploaded.map(({ doc, path }) => ({
          siniestro_id: siniestro.id,
          tipo: doc.mime.startsWith("image/") ? ("img" as const) : ("pdf" as const),
          nombre: doc.filename,
          mime_type: doc.mime,
          tamano_bytes: doc.size,
          contenido: null,
          url: path,
        })),
      });
    }
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

/** Normaliza el nombre para usarlo como object key del bucket (sin espacios ni acentos). */
function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

function collectDocuments(files: ClaimFiles): DecodedFile[] {
  const out: DecodedFile[] = [files.driver_license, files.vehicle_card];
  if (files.police_report) out.push(files.police_report);
  out.push(...files.additional_files);
  return out;
}
