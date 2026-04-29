/**
 * Data Controller — Siniestros
 *
 * Maneja todas las consultas a la base de datos relacionadas con siniestros.
 *
 * Tablas involucradas:
 *   - siniestros         (datos base del siniestro)
 *   - siniestros_poliza  (relación siniestro ↔ póliza)
 *   - polizas            (para obtener contexto de la póliza afectada)
 *   - poliza_cliente     (para obtener el cliente propietario de la póliza)
 */

import { prisma } from "../lib/prisma";

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------

export type SiniestroCreateInput = {
  fecha_ocurrencia?: Date;
  descripcion_hechos?: string;
  estado?: string;
  documentos_adjuntos?: string[];
  // Relación con póliza
  poliza_id?: number;
};

export type SiniestroUpdateInput = Partial<SiniestroCreateInput>;

// Include base reutilizable con todas las relaciones
const siniestroInclude = {
  siniestros_poliza: {
    include: {
      polizas: {
        include: {
          poliza_cliente: {
            include: {
              clientes: {
                include: {
                  clientes_corporativos: true,
                  clientes_no_corporativos: true,
                },
              },
            },
          },
          poliza_empresa: {
            include: { empresas_aseguradoras: true },
          },
          tipo_poliza: {
            include: { tipos_seguro: true },
          },
        },
      },
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Consultas de lectura
// ---------------------------------------------------------------------------

/**
 * Obtiene todos los siniestros con sus relaciones (póliza, cliente, aseguradora).
 */
export async function getSiniestros() {
  return prisma.siniestros.findMany({
    include: siniestroInclude,
    orderBy: { fecha_ocurrencia: "desc" },
  });
}

/**
 * Obtiene un siniestro por su ID interno.
 */
export async function getSiniestroById(id: number) {
  return prisma.siniestros.findUnique({
    where: { id },
    include: siniestroInclude,
  });
}

/**
 * Obtiene todos los siniestros vinculados a una póliza específica.
 */
export async function getSiniestrosByPoliza(polizaId: number) {
  return prisma.siniestros.findMany({
    where: {
      siniestros_poliza: {
        some: { id_poliza: polizaId },
      },
    },
    include: siniestroInclude,
    orderBy: { fecha_ocurrencia: "desc" },
  });
}

/**
 * Filtra siniestros por estado ("pendiente", "en_proceso", "resuelto", "rechazado", etc.).
 */
export async function getSiniestrosByEstado(estado: string) {
  return prisma.siniestros.findMany({
    where: { estado },
    include: siniestroInclude,
    orderBy: { fecha_ocurrencia: "desc" },
  });
}

/**
 * Obtiene todos los siniestros pendientes de resolución.
 */
export async function getSiniestrosPendientes() {
  return getSiniestrosByEstado("pendiente");
}

/**
 * Obtiene todos los siniestros en proceso.
 */
export async function getSiniestrosEnProceso() {
  return getSiniestrosByEstado("en_proceso");
}

/**
 * Obtiene los siniestros de un cliente específico (a través de sus pólizas).
 */
export async function getSiniestrosByCliente(clienteId: number) {
  return prisma.siniestros.findMany({
    where: {
      siniestros_poliza: {
        some: {
          polizas: {
            poliza_cliente: {
              cliente_id: clienteId,
            },
          },
        },
      },
    },
    include: siniestroInclude,
    orderBy: { fecha_ocurrencia: "desc" },
  });
}

/**
 * Obtiene siniestros ocurridos en un rango de fechas.
 */
export async function getSiniestrosByRangoDeFechas(desde: Date, hasta: Date) {
  return prisma.siniestros.findMany({
    where: {
      fecha_ocurrencia: {
        gte: desde,
        lte: hasta,
      },
    },
    include: siniestroInclude,
    orderBy: { fecha_ocurrencia: "desc" },
  });
}

/**
 * Obtiene las estadísticas de siniestros agrupadas por estado.
 */
export async function getEstadisticasSiniestros() {
  const totales = await prisma.siniestros.groupBy({
    by: ["estado"],
    _count: { id: true },
  });

  return totales.map((item: { estado: string | null; _count: { id: number } }) => ({
    estado: item.estado ?? "sin_estado",
    total: item._count.id,
  }));
}

// ---------------------------------------------------------------------------
// Mutaciones
// ---------------------------------------------------------------------------

/**
 * Crea un nuevo siniestro y lo vincula a una póliza si se especifica.
 */
export async function createSiniestro(data: SiniestroCreateInput) {
  return prisma.siniestros.create({
    data: {
      fecha_ocurrencia: data.fecha_ocurrencia,
      descripcion_hechos: data.descripcion_hechos,
      estado: data.estado ?? "pendiente",
      documentos_adjuntos: data.documentos_adjuntos ?? [],
      ...(data.poliza_id && {
        siniestros_poliza: {
          create: { id_poliza: data.poliza_id },
        },
      }),
    },
    include: siniestroInclude,
  });
}

/**
 * Actualiza los datos de un siniestro existente.
 */
export async function updateSiniestro(id: number, data: SiniestroUpdateInput) {
  return prisma.siniestros.update({
    where: { id },
    data: {
      fecha_ocurrencia: data.fecha_ocurrencia,
      descripcion_hechos: data.descripcion_hechos,
      estado: data.estado,
      documentos_adjuntos: data.documentos_adjuntos,
    },
    include: siniestroInclude,
  });
}

/**
 * Cambia el estado de un siniestro (shortcut para flujo de trabajo).
 */
export async function cambiarEstadoSiniestro(
  id: number,
  nuevoEstado: "pendiente" | "en_proceso" | "resuelto" | "rechazado"
) {
  return prisma.siniestros.update({
    where: { id },
    data: { estado: nuevoEstado },
    include: siniestroInclude,
  });
}

/**
 * Agrega documentos adjuntos a un siniestro existente (sin reemplazar los anteriores).
 */
export async function agregarDocumentosSiniestro(id: number, nuevosDocumentos: string[]) {
  const siniestro = await prisma.siniestros.findUnique({
    where: { id },
    select: { documentos_adjuntos: true },
  });

  if (!siniestro) throw new Error(`Siniestro con id ${id} no encontrado`);

  return prisma.siniestros.update({
    where: { id },
    data: {
      documentos_adjuntos: [...siniestro.documentos_adjuntos, ...nuevosDocumentos],
    },
    include: siniestroInclude,
  });
}

/**
 * Vincula un siniestro existente a una póliza.
 */
export async function vincularSiniestroAPoliza(siniestroId: number, polizaId: number) {
  return prisma.siniestros_poliza.upsert({
    where: { id_poliza: polizaId },
    create: { id_poliza: polizaId, id_siniestro: siniestroId },
    update: { id_siniestro: siniestroId },
  });
}

/**
 * Elimina un siniestro y su vínculo con la póliza.
 */
export async function deleteSiniestro(id: number) {
  // Eliminar relación primero por restricciones de FK
  await prisma.siniestros_poliza.deleteMany({ where: { id_siniestro: id } });
  return prisma.siniestros.delete({ where: { id } });
}
