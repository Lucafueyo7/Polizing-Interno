/**
 * Data Controller — Clientes
 *
 * Maneja todas las consultas a la base de datos relacionadas con clientes.
 * Los clientes pueden ser corporativos (CUIT / razón social) o no corporativos (DNI / nombre).
 *
 * Tablas involucradas:
 *   - clientes
 *   - clientes_corporativos
 *   - clientes_no_corporativos
 *   - poliza_cliente (relación polizas ↔ clientes)
 */

import { prisma } from "../lib/prisma";

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------

export type ClienteCreateInput = {
  email?: string;
  telefono?: string;
  direccion?: string;
  estado?: string;
  // Datos específicos del tipo de cliente (solo uno de los dos)
  corporativo?: {
    cuit: string;
    razon_social?: string;
  };
  no_corporativo?: {
    dni: string;
    nombre?: string;
    apellido?: string;
  };
};

export type ClienteUpdateInput = Partial<ClienteCreateInput>;

// ---------------------------------------------------------------------------
// Consultas de lectura
// ---------------------------------------------------------------------------

/**
 * Obtiene todos los clientes con sus datos extendidos (corporativo / no corporativo).
 */
export async function getClientes() {
  return prisma.clientes.findMany({
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
    },
    orderBy: { id: "desc" },
  });
}

/**
 * Obtiene un cliente por su ID interno.
 */
export async function getClienteById(id: number) {
  return prisma.clientes.findUnique({
    where: { id },
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
      poliza_cliente: {
        include: {
          polizas: {
            include: {
              tipo_poliza: { include: { tipos_seguro: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * Busca un cliente no corporativo por DNI.
 */
export async function getClienteByDni(dni: string) {
  const resultado = await prisma.clientes_no_corporativos.findFirst({
    where: { dni },
    include: {
      clientes: {
        include: {
          clientes_corporativos: true,
          clientes_no_corporativos: true,
          poliza_cliente: true,
        },
      },
    },
  });
  return resultado?.clientes ?? null;
}

/**
 * Busca un cliente corporativo por CUIT.
 */
export async function getClienteByCuit(cuit: string) {
  const resultado = await prisma.clientes_corporativos.findUnique({
    where: { cuit },
    include: {
      clientes: {
        include: {
          clientes_corporativos: true,
          poliza_cliente: true,
        },
      },
    },
  });
  return resultado?.clientes ?? null;
}

/**
 * Busca clientes por email (búsqueda parcial).
 */
export async function getClientesByEmail(email: string) {
  return prisma.clientes.findMany({
    where: {
      email: { contains: email, mode: "insensitive" },
    },
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
    },
  });
}

/**
 * Filtra clientes por estado ("activo", "inactivo", etc.).
 */
export async function getClientesByEstado(estado: string) {
  return prisma.clientes.findMany({
    where: { estado },
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
    },
    orderBy: { id: "desc" },
  });
}

/**
 * Obtiene todos los clientes corporativos.
 */
export async function getClientesCorporativos() {
  return prisma.clientes_corporativos.findMany({
    include: { clientes: true },
    orderBy: { cuit: "asc" },
  });
}

/**
 * Obtiene todos los clientes no corporativos (personas físicas).
 */
export async function getClientesNoCorporativos() {
  return prisma.clientes_no_corporativos.findMany({
    include: { clientes: true },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });
}

// ---------------------------------------------------------------------------
// Mutaciones
// ---------------------------------------------------------------------------

/**
 * Crea un nuevo cliente junto con sus datos extendidos (corporativo o no corporativo).
 */
export async function createCliente(data: ClienteCreateInput) {
  return prisma.clientes.create({
    data: {
      email: data.email,
      telefono: data.telefono,
      direccion: data.direccion,
      estado: data.estado ?? "activo",
      ...(data.corporativo && {
        clientes_corporativos: {
          create: {
            cuit: data.corporativo.cuit,
            razon_social: data.corporativo.razon_social,
          },
        },
      }),
      ...(data.no_corporativo && {
        clientes_no_corporativos: {
          create: {
            dni: data.no_corporativo.dni,
            nombre: data.no_corporativo.nombre,
            apellido: data.no_corporativo.apellido,
          },
        },
      }),
    },
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
    },
  });
}

/**
 * Actualiza los datos de un cliente existente.
 */
export async function updateCliente(id: number, data: ClienteUpdateInput) {
  return prisma.clientes.update({
    where: { id },
    data: {
      email: data.email,
      telefono: data.telefono,
      direccion: data.direccion,
      estado: data.estado,
      ...(data.corporativo && {
        clientes_corporativos: {
          upsert: {
            create: {
              cuit: data.corporativo.cuit,
              razon_social: data.corporativo.razon_social,
            },
            update: {
              cuit: data.corporativo.cuit,
              razon_social: data.corporativo.razon_social,
            },
          },
        },
      }),
      ...(data.no_corporativo && {
        clientes_no_corporativos: {
          upsert: {
            create: {
              dni: data.no_corporativo.dni,
              nombre: data.no_corporativo.nombre,
              apellido: data.no_corporativo.apellido,
            },
            update: {
              dni: data.no_corporativo.dni,
              nombre: data.no_corporativo.nombre,
              apellido: data.no_corporativo.apellido,
            },
          },
        },
      }),
    },
    include: {
      clientes_corporativos: true,
      clientes_no_corporativos: true,
    },
  });
}

/**
 * Elimina un cliente y sus datos extendidos (en cascada a nivel aplicación).
 */
export async function deleteCliente(id: number) {
  // Eliminar subtablas primero por restricciones de FK
  await prisma.clientes_corporativos.deleteMany({ where: { cliente_id: id } });
  await prisma.clientes_no_corporativos.deleteMany({ where: { cliente_id: id } });
  return prisma.clientes.delete({ where: { id } });
}
