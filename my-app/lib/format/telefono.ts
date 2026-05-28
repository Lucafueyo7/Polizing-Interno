/**
 * Almacenamos teléfonos como dígitos puros (formato E.164 sin `+`).
 * - `normalizeTelefono` despoja todo lo no numérico al guardar.
 * - `formatTelefono` agrega `+`, espacios y guiones al mostrar.
 *
 * Heurística AR: si el número arranca con `54`, formateamos como argentino:
 *   - Móvil: `54 9 <area 2-4> <8 dígitos>` → `+54 9 11 5634-7821`
 *   - Fijo:  `54 <area 2-4> <8 dígitos>`   → `+54 11 4892-1003`
 *
 * Para otros prefijos: agrupación genérica `+CC <resto>` con bloques de 4.
 */

export function normalizeTelefono(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function formatTelefono(stored: string | null | undefined): string {
  if (!stored) return "—";
  const digits = stored.replace(/\D/g, "");
  if (digits.length < 4) return digits;

  if (digits.startsWith("549") && digits.length >= 11) {
    return formatAr(digits.slice(3), { mobile: true });
  }
  if (digits.startsWith("54") && digits.length >= 10) {
    return formatAr(digits.slice(2), { mobile: false });
  }
  return formatGeneric(digits);
}

function formatAr(local: string, opts: { mobile: boolean }): string {
  // Áreas más comunes (BsAs `11`, Mendoza `261`, Córdoba `351`, ...).
  // Resto del número se separa con guión en bloques desde el final.
  const areaLen = local.startsWith("11") ? 2 : 3;
  const area = local.slice(0, areaLen);
  const num = local.slice(areaLen);
  const numFmt =
    num.length > 4 ? `${num.slice(0, num.length - 4)}-${num.slice(-4)}` : num;
  const prefix = opts.mobile ? "+54 9" : "+54";
  return `${prefix} ${area} ${numFmt}`.replace(/\s+/g, " ").trim();
}

function formatGeneric(digits: string): string {
  // CC de 1-3 dígitos: heurística según largo total (no tenemos tabla).
  const cc = digits.length > 11 ? digits.slice(0, 3) : digits.slice(0, 2);
  const rest = digits.slice(cc.length);
  const chunks: string[] = [];
  for (let i = 0; i < rest.length; i += 4) {
    chunks.push(rest.slice(i, i + 4));
  }
  return `+${cc} ${chunks.join(" ")}`.trim();
}
