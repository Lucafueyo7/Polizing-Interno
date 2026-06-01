type PagoItem = { monto: number };

export function pagoTotal(items: readonly PagoItem[]): number {
  return items.reduce((sum, item) => sum + item.monto, 0);
}
