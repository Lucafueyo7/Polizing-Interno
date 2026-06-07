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
    SeguroObligAut: "N",
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
    // Lee clientes y pólizas que provienen del sync de Berkley desde las tablas de dominio.
    const [clientesRows, polizasRows] = await Promise.all([
      prisma.clientes.findMany({
        where: { codigo_asegurado_berkley: { not: null } },
        include: {
          clientes_corporativos: true,
          clientes_no_corporativos: true,
        },
      }),
      prisma.polizas.findMany({
        where: {
          aseguradora: { codigo_integracion: "berkley" },
          rama: { not: null },
        },
        include: {
          cliente: { select: { codigo_asegurado_berkley: true } },
        },
      }),
    ]);

    return {
      source: "synced",
      generatedAt: new Date().toISOString(),
      clientes: clientesRows.map((c) => ({
        documento: c.clientes_no_corporativos?.dni ?? undefined,
        nombre:
          c.clientes_no_corporativos?.nombre ??
          c.clientes_corporativos?.razon_social ??
          undefined,
        cuit: c.clientes_corporativos?.cuit ?? undefined,
        email: c.email ?? undefined,
        telefono: c.telefono ?? undefined,
      })),
      polizas: polizasRows.map((p) => ({
        numeroPoliza: p.numero_poliza,
        rama: p.rama ?? undefined,
        estado: p.estado,
        vigenciaInicio: p.fecha_inicio_vigencia?.toISOString(),
        vigenciaFin: p.fecha_fin_vigencia?.toISOString(),
        clienteDocumento: p.cliente.codigo_asegurado_berkley ?? undefined,
      })),
    };
  }

  getNovedades(req: NovedadesRequest = {}): Promise<NovedadesResult> {
    return runBerkleySync(req);
  }
}
