export function timeAgo(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const date = iso instanceof Date ? iso : new Date(iso);
  const diffMin = Math.round((Date.now() - date.getTime()) / 60_000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffMin < 1440) return `hace ${Math.round(diffMin / 60)} h`;
  const diffDays = Math.round(diffMin / 1440);
  if (diffDays < 7) return `hace ${diffDays} d`;
  const isoStr = iso instanceof Date ? iso.toISOString() : iso;
  const [, M, D] = isoStr.split("T")[0].split("-");
  return `${D}/${M}`;
}
