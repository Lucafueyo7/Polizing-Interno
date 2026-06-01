const UNITS = ["B", "KB", "MB", "GB"] as const;

export function fmtBytes(bytes: number | null | undefined): string | null {
  if (bytes === null || bytes === undefined) return null;
  if (bytes < 1) return "0 B";
  const exp = Math.min(
    Math.floor(Math.log10(bytes) / 3),
    UNITS.length - 1,
  );
  const value = bytes / 1000 ** exp;
  const formatted = exp === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formatted} ${UNITS[exp]}`;
}
