/**
 * Parser genérico de archivos de ancho fijo (fixed-width).
 *
 * Los archivos GD de Berkley son texto plano donde cada campo ocupa una posición
 * fija (sin separadores) y vienen en charset latin1 / windows-1252 (NO UTF-8).
 * Ver manual Berkley §4.1. Las posiciones empiezan en 1.
 */

export type FixedField = {
  name: string;
  /** Posición inicial (base 1, inclusive). */
  desde: number;
  /** Cantidad de caracteres. */
  longitud: number;
};

export type FixedLayout = readonly FixedField[];

export type FixedRecord = Record<string, string>;

/** Decodifica un buffer legacy en latin1 (windows-1252). */
export function decodeLatin1(buffer: Buffer): string {
  return buffer.toString("latin1");
}

export function parseFixedWidthLine(line: string, layout: FixedLayout): FixedRecord {
  const record: FixedRecord = {};
  for (const field of layout) {
    const start = field.desde - 1;
    record[field.name] = line.slice(start, start + field.longitud).trim();
  }
  return record;
}

/**
 * Parsea un archivo completo. Acepta el buffer crudo (se decodifica como latin1)
 * o un string ya decodificado. Ignora líneas vacías.
 */
export function parseFixedWidth(
  input: Buffer | string,
  layout: FixedLayout,
): FixedRecord[] {
  const text = typeof input === "string" ? input : decodeLatin1(input);
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => parseFixedWidthLine(line, layout));
}

/** Convierte una fecha numérica AAAAMMDD (formato por defecto en los GD). */
export function parseFechaAAAAMMDD(value: string): Date | null {
  const s = value.trim();
  if (!/^\d{8}$/.test(s)) return null;
  const year = Number(s.slice(0, 4));
  const month = Number(s.slice(4, 6));
  const day = Number(s.slice(6, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * Parsea un importe de ancho fijo del formato GD de Berkley.
 * Los importes vienen como strings numéricos sin punto decimal, con `decimals`
 * decimales implícitos (por defecto 2). Retorna un string con punto decimal
 * compatible con Prisma Decimal(15,2), o null si el valor es vacío/cero.
 */
export function parseDecimalGD(value: string, decimals = 2): string | null {
  const s = value.trim();
  if (!s) return null;
  // Si ya trae punto decimal (defensivo), parsear directamente.
  if (s.includes(".")) {
    const n = Number(s);
    return Number.isFinite(n) && n !== 0 ? n.toFixed(2) : null;
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n === 0) return null;
  return (n / Math.pow(10, decimals)).toFixed(2);
}

/** Convierte una fecha numérica DDMMAAAA (usado puntualmente, ej. RieCer). */
export function parseFechaDDMMAAAA(value: string): Date | null {
  const s = value.trim();
  if (!/^\d{8}$/.test(s)) return null;
  const day = Number(s.slice(0, 2));
  const month = Number(s.slice(2, 4));
  const year = Number(s.slice(4, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  return Number.isFinite(d.getTime()) ? d : null;
}
