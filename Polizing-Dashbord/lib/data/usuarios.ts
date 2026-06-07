import "server-only";
import { prisma } from "@/lib/prisma";

export type UsuarioListItem = {
  id: number;
  nombreCompleto: string;
  email: string;
  dni: string;
  rol: "productor" | "administrativo";
};

export async function getUsuarioById(
  id: number,
): Promise<UsuarioListItem | null> {
  const row = await prisma.usuarios.findUnique({
    where: { id },
    select: { id: true, nombre_completo: true, email: true, dni: true, rol: true },
  });
  if (!row) return null;
  return {
    id: row.id,
    nombreCompleto: row.nombre_completo,
    email: row.email,
    dni: row.dni,
    rol: row.rol,
  };
}

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
