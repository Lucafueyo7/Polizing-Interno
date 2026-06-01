/**
 * Adapter de Federación Patronal (REST/OAuth2).
 *
 * Capacidades: `documents` (póliza, certificado de cobertura, tarjeta de
 * circulación) y `cartera` (en vivo). No soporta `novedades`.
 */

import "server-only";
import { z } from "zod";
import {
  BaseInsurerProvider,
  type Capability,
  type Cartera,
  type CarteraRequest,
  type DocumentRequest,
  type GeneratedDocument,
} from "../../types";
import { InsurerBusinessError, NotSupportedError } from "../../errors";
import { loadFedPatConfig, type FedPatConfig } from "../../config";
import {
  getCarteraClientes,
  getCertificadoCobertura,
  getReportePoliza,
  getTarjetaCirculacionLink,
  type PolizaPathParams,
} from "./client";
import { carteraClienteToDto, reporteToDocument } from "./mappers";

const paramsSchema = z.object({
  sucursal: z.coerce.number().int().nonnegative().optional(),
  ramo: z.coerce.number().int().nonnegative().optional(),
  poliza: z.coerce.number().int().nonnegative().optional(),
  certificado: z.coerce.number().int().nonnegative().optional(),
  endoso: z.coerce.number().int().nonnegative().optional(),
  numDocumento: z.string().trim().min(1).optional(),
  patente: z.string().trim().min(1).optional(),
});

type FedPatParams = z.infer<typeof paramsSchema>;

function requirePolizaParams(p: FedPatParams): PolizaPathParams {
  if (
    p.sucursal === undefined ||
    p.ramo === undefined ||
    p.poliza === undefined ||
    p.certificado === undefined
  ) {
    throw new InsurerBusinessError(
      "Faltan parámetros: sucursal, ramo, poliza, certificado",
      { provider: "federacion_patronal" },
    );
  }
  return {
    sucursal: p.sucursal,
    ramo: p.ramo,
    poliza: p.poliza,
    certificado: p.certificado,
    endoso: p.endoso,
  };
}

function ddMMyyyy(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const y = date.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

export class FederacionPatronalProvider extends BaseInsurerProvider {
  readonly slug = "federacion_patronal";
  readonly displayName = "Federación Patronal";
  readonly capabilities: ReadonlySet<Capability> = new Set<Capability>([
    "documents",
    "cartera",
  ]);

  private readonly config: FedPatConfig;

  constructor(config: FedPatConfig = loadFedPatConfig()) {
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
    const params = parsed.data;
    const out: GeneratedDocument[] = [];

    for (const tipo of req.documentos) {
      switch (tipo) {
        case "poliza": {
          const r = await getReportePoliza(this.config, requirePolizaParams(params));
          out.push(reporteToDocument(tipo, r));
          break;
        }
        case "certificado_cobertura": {
          const r = await getCertificadoCobertura(
            this.config,
            requirePolizaParams(params),
          );
          out.push(reporteToDocument(tipo, r));
          break;
        }
        case "tarjeta_circulacion": {
          if (!params.numDocumento || !params.patente) {
            throw new InsurerBusinessError(
              "Faltan parámetros: numDocumento, patente",
              { provider: this.slug },
            );
          }
          const link = await getTarjetaCirculacionLink(
            this.config,
            params.numDocumento,
            params.patente,
          );
          out.push({
            tipo,
            filename: `tarjeta-circulacion-${params.patente}.pdf`,
            mime_type: "application/pdf",
            source_url: link,
          });
          break;
        }
        default:
          throw new NotSupportedError(
            `Federación Patronal no genera el documento "${tipo}"`,
            { provider: this.slug },
          );
      }
    }

    return out;
  }

  override async getCartera(req: CarteraRequest): Promise<Cartera> {
    const fecha = ddMMyyyy(req.fecha ?? new Date());
    const tipo = req.tipo ?? "I";
    const res = await getCarteraClientes(this.config, fecha, tipo);
    return {
      source: "live",
      generatedAt: new Date().toISOString(),
      clientes: (res.clientes ?? []).map(carteraClienteToDto),
      polizas: [],
    };
  }
}
