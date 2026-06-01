const LONG_DATE_FMT = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function fmtLongDate(iso: string): string {
  const text = LONG_DATE_FMT.format(new Date(`${iso}T00:00:00`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}
