export function buildPayReference(pagoId: number): string {
  return `PAY-${pagoId.toString().padStart(5, "0")}`;
}
