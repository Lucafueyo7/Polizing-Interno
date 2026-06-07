import "server-only";
import { prisma } from "@/lib/prisma";

export type UsuarioListItem = {
  id: number;
  nombreCompleto: string;
  email: string;
  dni: string;
  rol: "productor" | "administrativo";
};

export async function getUsuarios(): Promise<UsuarioListItem[]> {
  const rows = await prisma.usuarios.findMany({
    orderBy: { nombre_completo: "asc" },
    select: { id: true, nombre_completo: true, email: true, dni: true, rol: true },
  });
  return rows.map((r) => ({
    id: r.id,
    nombreCompleto: r.nombre_completo,
    email: r.email,
    dni: r.dni,
    rol: r.rol,
  }));
}
