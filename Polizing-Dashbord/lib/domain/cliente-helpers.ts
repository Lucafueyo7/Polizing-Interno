type ClienteCorp = {
  tipo: "corp";
  razonSocial: string;
  cuit: string;
};

type ClienteParticular = {
  tipo: "normal";
  nombre: string;
  apellido: string;
  dni: string;
};

export type ClienteCore = ClienteCorp | ClienteParticular;

export function clienteLabel(c: ClienteCore): string {
  return c.tipo === "corp" ? c.razonSocial : `${c.nombre} ${c.apellido}`.trim();
}

export function clienteIdent(c: ClienteCore): string {
  return c.tipo === "corp" ? c.cuit : c.dni;
}

export function clienteAvatarLetters(c: ClienteCore): string {
  if (c.tipo === "corp") {
    return c.razonSocial
      .split(" ")
      .filter((word) => word.length > 2)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }
  return `${c.nombre[0] ?? ""}${c.apellido[0] ?? ""}`.toUpperCase();
}
