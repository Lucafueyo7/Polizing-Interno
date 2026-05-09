/**
 * Normaliza un connection string de Postgres asegurando que el password esté
 * percent-encoded. Soporta passwords con caracteres reservados (`@`, `:`, etc.)
 * que de otra forma confunden al parser de `pg-connection-string`.
 *
 * Idempotente: si el password ya está percent-encoded lo devuelve igual.
 */
export function normalizePgUrl(raw: string): string {
  const protoIdx = raw.indexOf("://");
  if (protoIdx === -1) return raw;
  const head = raw.slice(0, protoIdx + 3);
  const remainder = raw.slice(protoIdx + 3);

  const lastAt = remainder.lastIndexOf("@");
  if (lastAt === -1) return raw;

  const userInfo = remainder.slice(0, lastAt);
  const hostPart = remainder.slice(lastAt + 1);

  const colonIdx = userInfo.indexOf(":");
  if (colonIdx === -1) return raw;

  const user = userInfo.slice(0, colonIdx);
  const pass = userInfo.slice(colonIdx + 1);

  let decoded: string;
  try {
    decoded = decodeURIComponent(pass);
  } catch {
    decoded = pass;
  }

  return `${head}${user}:${encodeURIComponent(decoded)}@${hostPart}`;
}
