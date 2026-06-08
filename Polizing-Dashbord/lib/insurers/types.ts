/**
 * Contrato genérico de integración con aseguradoras (ports & adapters).
 *
 * El núcleo define DTOs e interfaz; cada aseguradora implementa un adapter en
 * `lib/insurers/providers/<slug>/`. Sumar una aseguradora nueva = escribir su
 * adapter y registrarlo en `registry.ts`. El código que consume nunca habla con
 * un proveedor concreto: pide capacidades a través de esta interfaz.
 */

import { NotSupportedError } from "./errors";

/** Capacidades que un proveedor puede declarar soportar. */
export type Capability = "documents" | "cartera" | "novedades";

/**
 * Tipos de documento que se pueden generar de forma genérica. Cada adapter mapea
 * estos valores a sus propios flags/endpoints (no todos los soportan todos).
 */
export type DocumentoTipo =
  | "poliza"
  | "tarjeta_circulacion"
  | "certificado_cobertura"
  | "certificado_mercosur"
  | "constancia_pago"
  | "cuponera";

/** Documento generado y normalizado. Trae los bytes en base64 o un link. */
export type GeneratedDocument = {
  tipo: DocumentoTipo;
  filename: string;
  mime_type: string;
  /** Contenido en base64 cuando el proveedor devuelve el archivo. */
  content_base64?: string;
  /** Link de descarga cuando el proveedor devuelve una URL en lugar de bytes. */
  source_url?: string;
};

/**
 * Pedido de generación de documentos. `params` es específico de cada proveedor
 * (Berkley: rama/poliza/endoso/riesgo; Fed.Patronal: sucursal/ramo/poliza/
 * certificado/endoso) y lo valida el adapter con su propio schema Zod.
 */
export type DocumentRequest = {
  documentos: DocumentoTipo[];
  params: Record<string, string | number | undefined>;
};

export type CarteraCliente = {
  documento?: string;
  nombre?: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  /** Campos crudos del proveedor que no se normalizaron. */
  raw?: Record<string, unknown>;
};

export type CarteraPoliza = {
  numeroPoliza: string;
  rama?: string;
  estado?: string;
  vigenciaInicio?: string;
  vigenciaFin?: string;
  clienteDocumento?: string;
  raw?: Record<string, unknown>;
};

/**
 * Cartera del productor. `source` indica si los datos vienen en vivo de la API
 * ("live", Fed.Patronal) o de la base local sincronizada por el cron ("synced",
 * Berkley). Cada proveedor llena las colecciones que tiene disponibles.
 */
export type Cartera = {
  source: "live" | "synced";
  generatedAt: string;
  clientes: CarteraCliente[];
  polizas: CarteraPoliza[];
};

export type CarteraRequest = {
  /** Fecha de corte (los adapters la formatean según su API). Default: hoy. */
  fecha?: Date;
  /** Tipo de productor (Fed.Patronal); opcional para otros proveedores. */
  tipo?: string;
};

/** Una novedad detectada en el sync de Berkley (alta o cambio). */
export type Novedad = {
  tipo: "alta" | "cambio";
  archivo: string;
  rama: string | null;
  poliza: string | null;
  suplemento: string | null;
  payload: Record<string, unknown>;
  detectadaEn: string;
};

export type NovedadesRequest = {
  /** Fecha desde la cual pedir novedades. Default lo decide el orquestador. */
  fechaDesde?: Date;
};

export type NovedadesResult = {
  archivosDescargados: number;
  novedadesDetectadas: number;
  novedades: Novedad[];
};

export type DownloadedDocument = {
  bytes: Buffer;
  mime_type: string;
};

export interface InsurerProvider {
  readonly slug: string;
  readonly displayName: string;
  readonly capabilities: ReadonlySet<Capability>;
  supports(cap: Capability): boolean;
  generateDocuments(req: DocumentRequest): Promise<GeneratedDocument[]>;
  downloadDocument(sourceUrl: string): Promise<DownloadedDocument>;
  getCartera(req: CarteraRequest): Promise<Cartera>;
  getNovedades?(req: NovedadesRequest): Promise<NovedadesResult>;
}

/**
 * Base con la lógica común: declaración de capacidades y métodos que por defecto
 * lanzan `NotSupportedError`. Cada adapter sobreescribe solo lo que implementa.
 */
export abstract class BaseInsurerProvider implements InsurerProvider {
  abstract readonly slug: string;
  abstract readonly displayName: string;
  abstract readonly capabilities: ReadonlySet<Capability>;

  supports(cap: Capability): boolean {
    return this.capabilities.has(cap);
  }

  protected notSupported(cap: Capability): never {
    throw new NotSupportedError(
      `El proveedor "${this.slug}" no soporta la capacidad "${cap}"`,
      { provider: this.slug },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateDocuments(_req: DocumentRequest): Promise<GeneratedDocument[]> {
    return this.notSupported("documents");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  downloadDocument(_sourceUrl: string): Promise<DownloadedDocument> {
    return this.notSupported("documents");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCartera(_req: CarteraRequest): Promise<Cartera> {
    return this.notSupported("cartera");
  }
}
