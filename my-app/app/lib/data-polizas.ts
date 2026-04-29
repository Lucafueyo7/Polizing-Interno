/**
 * Data Controller — Pólizas
 *
 * Maneja todas las consultas a la base de datos relacionadas con pólizas de seguro.
 *
 * Tablas involucradas:
 *   - polizas                (datos base de la póliza)
 *   - poliza_cliente         (relación póliza ↔ cliente)
 *   - poliza_empresa         (relación póliza ↔ empresa aseguradora)
 *   - tipo_poliza            (relación póliza ↔ tipo de seguro)
 *   - cobertura_poliza       (relación póliza ↔ cobertura)
 *   - pagos_polizas          (relación póliza ↔ pago)
 *   - siniestros_poliza      (relación póliza ↔ siniestro)
 */

import { prisma } from "../lib/prisma";

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------

export type PolizaCreateInput = {
  numero_poliza?: string;
  fecha_emision?: Date;
  fecha_inicio_vigencia?: Date;
  fecha_fin_vigencia?: Date;
  estado?: string;
  suma_asegurada?: number;
  tarjeta_circulacion_poliza?: string;
  numero_cuota?: number;
  // Relaciones opcionales al crear
  cliente_id?: number;
  aseguradora_id?: number;
  tipo_seguro?: string;
  cobertura_id?: number;
};

export type PolizaUpdateInput = Partial<PolizaCreateInput>;

// Include base reutilizable con todas las relaciones
const polizaInclude = {
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
  cobertura_poliza: {
    include: { coberturas: true },
  },
  pagos_polizas: {
    include: { pagos: true },
  },
  siniestros_poliza: {
    include: { siniestros: true },
  },
} as const;

// ---------------------------------------------------------------------------
// Consultas de lectura
// ---------------------------------------------------------------------------

/**
 * Obtiene todas las pólizas con sus relaciones completas.
 */
export async function getPolizas() {
  return prisma.polizas.findMany({
    include: polizaInclude,
    orderBy: { id: "desc" },
  });
}

/**
 * Obtiene una póliza por su ID interno.
 */
export async function getPolizaById(id: number) {
  return prisma.polizas.findUnique({
    where: { id },
    include: polizaInclude,
  });
}

/**
 * Busca una póliza por su número de póliza (campo de negocio).
 */
export async function getPolizaByNumero(numero_poliza: string) {
  return prisma.polizas.findFirst({
    where: { numero_poliza },
    include: polizaInclude,
  });
}

/**
 * Obtiene todas las pólizas de un cliente específico.
 */
export async function getPolizasByCliente(clienteId: number) {
  return prisma.polizas.findMany({
    where: {
      poliza_cliente: { cliente_id: clienteId },
    },
    include: polizaInclude,
    orderBy: { fecha_emision: "desc" },
  });
}

/**
 * Filtra pólizas por estado ("activa", "vencida", "cancelada", etc.).
 */
export async function getPolizasByEstado(estado: string) {
  return prisma.polizas.findMany({
    where: { estado },
    include: polizaInclude,
    orderBy: { fecha_fin_vigencia: "asc" },
  });
}

/**
 * Obtiene sólo las pólizas activas.
 */
export async function getPolizasActivas() {
  return getPolizasByEstado("activa");
}

/**
 * Obtiene pólizas por tipo de seguro (ej: "auto", "hogar", "vida").
 */
export async function getPolizasByTipo(tipoSeguro: string) {
  return prisma.polizas.findMany({
    where: {
      tipo_poliza: { tipo_seguro_id: tipoSeguro },
    },
    include: polizaInclude,
    orderBy: { id: "desc" },
  });
}

/**
 * Obtiene pólizas por empresa aseguradora.
 */
export async function getPolizasByAseguradora(aseguradoraId: number) {
  return prisma.polizas.findMany({
    where: {
      poliza_empresa: { aseguradora_id: aseguradoraId },
    },
    include: polizaInclude,
    orderBy: { id: "desc" },
  });
}

/**
 * Obtiene pólizas próximas a vencer en los próximos N días.
 */
export async function getPolizasProximasAVencer(diasRestantes: number = 30) {
  const hoy = new Date();
  const limite = new Date();
  limite.setDate(hoy.getDate() + diasRestantes);

  return prisma.polizas.findMany({
    where: {
      estado: "activa",
      fecha_fin_vigencia: {
        gte: hoy,
        lte: limite,
      },
    },
    include: polizaInclude,
    orderBy: { fecha_fin_vigencia: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Mutaciones
// ---------------------------------------------------------------------------

/**
 * Crea una nueva póliza con sus relaciones (cliente, aseguradora, tipo, cobertura).
 */
export async function createPoliza(data: PolizaCreateInput) {
  return prisma.polizas.create({
    data: {
      numero_poliza: data.numero_poliza,
      fecha_emision: data.fecha_emision,
      fecha_inicio_vigencia: data.fecha_inicio_vigencia,
      fecha_fin_vigencia: data.fecha_fin_vigencia,
      estado: data.estado ?? "activa",
      suma_asegurada: data.suma_asegurada,
      tarjeta_circulacion_poliza: data.tarjeta_circulacion_poliza,
      numero_cuota: data.numero_cuota,
      ...(data.cliente_id && {
        poliza_cliente: { create: { cliente_id: data.cliente_id } },
      }),
      ...(data.aseguradora_id && {
        poliza_empresa: { create: { aseguradora_id: data.aseguradora_id } },
      }),
      ...(data.tipo_seguro && {
        tipo_poliza: { create: { tipo_seguro_id: data.tipo_seguro } },
      }),
      ...(data.cobertura_id && {
        cobertura_poliza: { create: { cobertura_id: data.cobertura_id } },
      }),
    },
    include: polizaInclude,
  });
}

/**
 * Actualiza los datos base de una póliza existente.
 */
export async function updatePoliza(id: number, data: PolizaUpdateInput) {
  return prisma.polizas.update({
    where: { id },
    data: {
      numero_poliza: data.numero_poliza,
      fecha_emision: data.fecha_emision,
      fecha_inicio_vigencia: data.fecha_inicio_vigencia,
      fecha_fin_vigencia: data.fecha_fin_vigencia,
      estado: data.estado,
      suma_asegurada: data.suma_asegurada,
      tarjeta_circulacion_poliza: data.tarjeta_circulacion_poliza,
      numero_cuota: data.numero_cuota,
    },
    include: polizaInclude,
  });
}

/**
 * Cancela una póliza cambiando su estado a "cancelada".
 */
export async function cancelarPoliza(id: number) {
  return prisma.polizas.update({
    where: { id },
    data: { estado: "cancelada" },
    include: polizaInclude,
  });
}

/**
 * Elimina una póliza y todas sus relaciones (en cascada a nivel aplicación).
 */
export async function deletePoliza(id: number) {
  // Eliminar relaciones dependientes primero por restricciones de FK
  await prisma.siniestros_poliza.deleteMany({ where: { id_poliza: id } });
  await prisma.cobertura_poliza.deleteMany({ where: { id_poliza: id } });
  await prisma.pagos_polizas.deleteMany({ where: { id_poliza: id } });
  await prisma.poliza_cliente.deleteMany({ where: { poliza_id: id } });
  await prisma.poliza_empresa.deleteMany({ where: { id_poliza: id } });
  await prisma.tipo_poliza.deleteMany({ where: { id_poliza: id } });
  return prisma.polizas.delete({ where: { id } });
}
