import * as cheerio from "cheerio";
import { z } from "zod";

const FEED_URL = "https://asegurandodigital.com.ar/feed/";
const USER_AGENT = "Polizing-Interno-Bot/1.0 (+contacto interno)";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_ITEMS = 20;
const RESUMEN_MAX_CHARS = 280;

const NoticiaScrapeadaSchema = z.object({
  url_origen: z.string().url(),
  titulo: z.string().min(3).max(500),
  resumen: z.string().max(2_000).nullable(),
  imagen_url: z.string().url().nullable(),
  publicada_en: z.date().nullable(),
  categoria: z.string().max(120).nullable(),
});

export type NoticiaScrapeada = z.infer<typeof NoticiaScrapeadaSchema>;

export async function scrapeAsegurandoDigital(): Promise<NoticiaScrapeada[]> {
  const res = await fetch(FEED_URL, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Feed RSS respondió ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  return parseFeed(xml);
}

function parseFeed(xml: string): NoticiaScrapeada[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const seen = new Set<string>();
  const out: NoticiaScrapeada[] = [];

  $("item").each((_, el) => {
    if (out.length >= MAX_ITEMS) return false;
    const item = $(el);

    const titulo = decode(item.find("title").first().text().trim());
    const url_origen = item.find("link").first().text().trim();
    if (!titulo || !url_origen || seen.has(url_origen)) return;

    const pubDateRaw = item.find("pubDate").first().text().trim();
    const publicada_en = parseRfc2822(pubDateRaw);

    const categoria = item.find("category").first().text().trim() || null;

    const descriptionHtml = item.find("description").first().text();
    const contentHtml = item.find("content\\:encoded, encoded").first().text();
    const resumen = buildResumen(descriptionHtml || contentHtml);
    const imagen_url = extractFirstImg(contentHtml || descriptionHtml);

    const candidate = {
      url_origen,
      titulo,
      resumen,
      imagen_url,
      publicada_en,
      categoria: categoria ? decode(categoria) : null,
    };

    const parsed = NoticiaScrapeadaSchema.safeParse(candidate);
    if (parsed.success) {
      seen.add(url_origen);
      out.push(parsed.data);
    }
  });

  out.sort((a, b) => {
    const ta = a.publicada_en?.getTime() ?? 0;
    const tb = b.publicada_en?.getTime() ?? 0;
    return tb - ta;
  });
  return out;
}

function parseRfc2822(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function buildResumen(html: string): string | null {
  if (!html) return null;
  const text = decode(stripTags(html)).replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (text.length <= RESUMEN_MAX_CHARS) return text;
  return text.slice(0, RESUMEN_MAX_CHARS - 1).trimEnd() + "…";
}

function extractFirstImg(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8230;/g, "…")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
}
