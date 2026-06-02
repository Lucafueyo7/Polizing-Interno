import { prisma } from "@/lib/prisma";
import { scrapeAsegurandoDigital } from "@/lib/scrapers/asegurando-digital";

export type NoticiaListItem = {
  id: number;
  titulo: string;
  resumen: string | null;
  url: string;
  imagenUrl: string | null;
  publicadaEn: string | null;
  categoria: string | null;
  fuente: string;
};

const TAKE_LIMIT = 12;

export async function getNoticias(): Promise<NoticiaListItem[]> {
  const rows = await prisma.noticias_scrapeadas.findMany({
    orderBy: [{ publicada_en: "desc" }, { scrapeada_en: "desc" }],
    take: TAKE_LIMIT,
  });

  return rows.map((row) => ({
    id: row.id,
    titulo: row.titulo,
    resumen: row.resumen,
    url: row.url_origen,
    imagenUrl: row.imagen_url,
    publicadaEn: row.publicada_en?.toISOString() ?? null,
    categoria: row.categoria,
    fuente: row.fuente,
  }));
}

export async function refreshSnapshot(): Promise<void> {
  try {
    const scraped = await scrapeAsegurandoDigital();
    if (scraped.length === 0) return;
    await prisma.$transaction([
      prisma.noticias_scrapeadas.deleteMany({}),
      prisma.noticias_scrapeadas.createMany({
        data: scraped.map((n) => ({
          url_origen: n.url_origen,
          titulo: n.titulo,
          resumen: n.resumen,
          imagen_url: n.imagen_url,
          publicada_en: n.publicada_en,
          categoria: n.categoria,
        })),
      }),
    ]);
  } catch (err) {
    console.error(
      "[noticias] scrape falló, sirviendo último snapshot de DB",
      err,
    );
  }
}
