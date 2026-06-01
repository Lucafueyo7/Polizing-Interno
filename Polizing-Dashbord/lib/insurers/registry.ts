/**
 * Registry de proveedores. Mapea slug → adapter y resuelve el proveedor de una
 * aseguradora a partir de su columna `codigo_integracion`. Sumar una aseguradora
 * nueva = agregar una entrada acá apuntando a su adapter.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import type { Capability, InsurerProvider } from "./types";
import { InsurerError, NotSupportedError } from "./errors";
import { isInsurerSlug, type InsurerSlug } from "./slugs";
import { FederacionPatronalProvider } from "./providers/federacion-patronal";
import { BerkleyProvider } from "./providers/berkley";

/** Factories perezosas: la config (env vars) se valida recién al instanciar. */
const FACTORIES: Record<InsurerSlug, () => InsurerProvider> = {
  berkley: () => new BerkleyProvider(),
  federacion_patronal: () => new FederacionPatronalProvider(),
};

export function getProvider(slug: string): InsurerProvider {
  if (!isInsurerSlug(slug)) {
    throw new InsurerError(`Proveedor desconocido: "${slug}"`);
  }
  return FACTORIES[slug]();
}

/** Resuelve el proveedor de una aseguradora por su `codigo_integracion`. */
export async function getProviderForAseguradora(
  aseguradoraId: number,
): Promise<InsurerProvider> {
  const row = await prisma.empresas_aseguradoras.findUnique({
    where: { id: aseguradoraId },
    select: { codigo_integracion: true },
  });
  if (!row?.codigo_integracion) {
    throw new InsurerError(
      `La aseguradora ${aseguradoraId} no tiene integración configurada`,
    );
  }
  return getProvider(row.codigo_integracion);
}

/** Obtiene un proveedor verificando que soporte la capacidad pedida. */
export function getProviderWithCapability(
  slug: string,
  capability: Capability,
): InsurerProvider {
  const provider = getProvider(slug);
  if (!provider.supports(capability)) {
    throw new NotSupportedError(
      `El proveedor "${slug}" no soporta "${capability}"`,
      { provider: slug },
    );
  }
  return provider;
}
