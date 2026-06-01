const formatter = new Intl.NumberFormat("es-AR");

export function fmtNum(value: number): string {
  return formatter.format(value);
}
