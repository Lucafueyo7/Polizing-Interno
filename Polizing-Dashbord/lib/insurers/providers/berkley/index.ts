/**
 * Adapter de Berkley (SOAP).
 *
 * Capacidades: `documents` (WSMOBImp_v2), `cartera` (desde la base local
 * sincronizada por el cron) y `novedades` (corre el sync diario).
 */

import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  BaseInsurerProvider,
  type Capability,
  type Cartera,
  type DocumentRequest,
  type DocumentoTipo,
  type GeneratedDocument,
  type NovedadesRequest,
  type NovedadesResult,
} from "../../types";
import { InsurerBusinessError } from "../../errors";
import { loadBerkleyConfig, type BerkleyConfig } from "../../config";
import { awsmobimp, type WsmobimpFlags } from "./client";
import { runBerkleySync } from "./novedades";

/** Orden canónico de documentos = orden de los flags en el envelope WSMOBImp. */
const FLAG_ORDER: { tipo: DocumentoTipo; flag: keyof WsmobimpFlags }[] = [
  { tipo: "poliza", flag: "CopiaPoliza" },
  { tipo: "certificado_cobertura", flag: "CertificadoCobertura" },
  { tipo: "certificado_mercosur", flag: "CertificadoMercosur" },
  { tipo: "constancia_pago", flag: "ConstanciaPago" },
  { tipo: "cuponera", flag: "Cuponera" },
  { tipo: "tarjeta_circulacion", flag: "TarjetaCirculacion" },
];

const paramsSchema = z.object({
  rama: z.coerce.number().int().nonnegative(),
  poliza: z.coerce.number().int().nonnegative().optional(),
  endoso: z.coerce.number().int().nonnegative().default(0),
  riesgo: z.coerce.number().int().nonnegative().optional(),
  solicitud: z.coerce.number().int().nonnegative().optional(),
  empresa: z.coerce.number().int().nonnegative().optional(),
});

function buildFlags(documentos: DocumentoTipo[]): WsmobimpFlags {
  const flags: WsmobimpFlags = {
    CopiaPoliza: "N",
    CertificadoCobertura: "N",
    CertificadoMercosur: "N",
    ConstanciaPago: "N",
    Cuponera: "N",
    ImprimeSolicitud: "N",
    TarjetaCirculacion: "N",
    EnviaMail: "N", // nunca enviamos mail desde la integración (crítico en TST).
  };
  for (const { tipo, flag } of FLAG_ORDER) {
    if (documentos.includes(tipo)) flags[flag] = "S";
  }
  return flags;
}

export class BerkleyProvider extends BaseInsurerProvider {
  readonly slug = "berkley";
  readonly displayName = "Berkley";
  readonly capabilities: ReadonlySet<Capability> = new Set<Capability>([
    "documents",
    "cartera",
    "novedades",
  ]);

  private readonly config: BerkleyConfig;

  constructor(config: BerkleyConfig = loadBerkleyConfig()) {
    super();
    this.config = config;
  }

  override async generateDocuments(
    req: DocumentRequest,
  ): Promise<GeneratedDocument[]> {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new InsurerBusinessError("Parámetros inválidos", {
        provider: this.slug,
        detail: parsed.error.issues.map((i) => i.message).join("; "),
      });
    }

    const unsupported = req.documentos.filter(
      (t) => !FLAG_ORDER.some((f) => f.tipo === t),
    );
    if (unsupported.length > 0) {
      throw new InsurerBusinessError(
        `Berkley no genera: ${unsupported.join(", ")}`,
        { provider: this.slug },
      );
    }

    const flags = buildFlags(req.documentos);
    const documentos = await awsmobimp(this.config, {
      ...parsed.data,
      flags,
    });

    // Asociar las respuestas (en orden de flags S) con los tipos solicitados.
    const requestedOrdered = FLAG_ORDER.filter((f) =>
      req.documentos.includes(f.tipo),
    );

    return documentos.map((doc, i) => {
      if (doc.errorCodigo && doc.errorCodigo !== "0") {
        throw new InsurerBusinessError(
          doc.errorDescripcion || `Error generando documento (${doc.errorCodigo})`,
          { provider: this.slug, code: doc.errorCodigo },
        );
      }
      const tipo = requestedOrdered[i]?.tipo ?? "poliza";
      return {
        tipo,
        filename: doc.nombre || `${tipo}.pdf`,
        mime_type: "application/pdf",
        source_url: doc.link,
      };
    });
  }

  override async getCartera(): Promise<Cartera> {
    const [clientes, polizas] = await Promise.all([
      prisma.berkley_cartera_clientes.findMany(),
      prisma.berkley_cartera_polizas.findMany(),
    ]);

    return {
      source: "synced",
      generatedAt: new Date().toISOString(),
      clientes: clientes.map((c) => ({
        documento: c.numero_documento ?? undefined,
        nombre: c.nombre ?? undefined,
        cuit: c.cuit ?? undefined,
        email: c.email ?? undefined,
        telefono: c.telefono ?? undefined,
      })),
      polizas: polizas.map((p) => ({
        numeroPoliza: `${p.rama}-${p.poliza}`,
        rama: p.rama,
        estado: p.anulada ? "anulada" : "vigente",
        vigenciaInicio: p.vigencia_inicio?.toISOString(),
        vigenciaFin: p.vigencia_fin?.toISOString(),
        clienteDocumento: p.codigo_asegurado ?? undefined,
      })),
    };
  }

  getNovedades(req: NovedadesRequest = {}): Promise<NovedadesResult> {
    return runBerkleySync(req);
  }
}
