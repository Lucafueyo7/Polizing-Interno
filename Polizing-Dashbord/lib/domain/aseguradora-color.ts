const PALETTE = [
  "#0f2744",
  "#0d8a5f",
  "#b6620a",
  "#1c5fc7",
  "#7c3aed",
  "#b42318",
  "#0891b2",
  "#be185d",
] as const;

export function aseguradoraColor(id: number): string {
  const index = ((id - 1) % PALETTE.length + PALETTE.length) % PALETTE.length;
  return PALETTE[index];
}
