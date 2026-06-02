/**
 * "Fecha de hoy" del producto. El seed y todas las cuentas de vencimiento la usan
 * como ancla. Cambiar acá implica reseedear: la coherencia visual depende de esto.
 */
export const TODAY_ISO = "2026-05-08";

export function fmtDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const isoStr = iso instanceof Date ? iso.toISOString() : iso;
  const datePart = isoStr.split("T")[0];
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.round(ms / 86_400_000);
}

export function daysUntilExpiry(finIso: string): number {
  return daysBetween(TODAY_ISO, finIso);
}

/**
 * Convierte una fecha en formato DD/MM/YYYY a ISO yyyy-mm-dd.
 * Retorna null si el formato es inválido.
 */
export function parseDmyToIso(dmy: string): string | null {
  const parts = dmy.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (!d || !m || !y || y.length !== 4) return null;
  const dd = parseInt(d, 10);
  const mm = parseInt(m, 10);
  const yyyy = parseInt(y, 10);
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1900) return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}
