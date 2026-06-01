"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, Download, FileText } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import type { DocumentoTipo, GeneratedDocument } from "@/lib/insurers/types";
import { generarDocumentoPoliza } from "../../_actions/generar-documento";

const DOC_OPTIONS: { value: DocumentoTipo; label: string }[] = [
  { value: "poliza", label: "Copia de póliza" },
  { value: "tarjeta_circulacion", label: "Tarjeta de circulación" },
  { value: "certificado_cobertura", label: "Certificado de cobertura" },
  { value: "certificado_mercosur", label: "Certificado MERCOSUR" },
  { value: "constancia_pago", label: "Constancia de pago" },
  { value: "cuponera", label: "Cuponera" },
];

const PARAMS_PLACEHOLDER = `Berkley: rama=1, poliza=1234567, endoso=0
Fed. Patronal: sucursal=0, ramo=0, poliza=0, certificado=0
Tarjeta (Fed.Pat.): numDocumento=..., patente=...`;

/** Convierte el texto "clave=valor" (una por línea) en un objeto de parámetros. */
function parseParams(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*[=:]\s*(.+?)\s*$/);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

export function GenerarDocumentoCard({
  aseguradoraId,
}: {
  aseguradoraId: number;
}) {
  const [selected, setSelected] = useState<Set<DocumentoTipo>>(new Set());
  const [paramsText, setParamsText] = useState("");
  const [docs, setDocs] = useState<GeneratedDocument[]>([]);
  const [isPending, startTransition] = useTransition();

  const toggle = (tipo: DocumentoTipo, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(tipo);
      else next.delete(tipo);
      return next;
    });
  };

  const onGenerate = () => {
    if (selected.size === 0) {
      toastError("Seleccioná al menos un documento");
      return;
    }
    startTransition(async () => {
      const result = await generarDocumentoPoliza({
        aseguradoraId,
        documentos: [...selected],
        params: parseParams(paramsText),
      });
      if (!result.ok) {
        toastError(result.error);
        return;
      }
      setDocs(result.documentos);
      toastSuccess(`${result.documentos.length} documento(s) generado(s)`);
    });
  };

  return (
    <Card className="overflow-hidden p-0 gap-0">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">
          Generar documentos
        </h3>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-2">
          {DOC_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 text-[13px] cursor-pointer"
            >
              <Checkbox
                checked={selected.has(opt.value)}
                onCheckedChange={(checked) => toggle(opt.value, checked === true)}
              />
              {opt.label}
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
            Parámetros
          </span>
          <Textarea
            value={paramsText}
            onChange={(e) => setParamsText(e.target.value)}
            placeholder={PARAMS_PLACEHOLDER}
            rows={4}
            className="font-mono text-[12px]"
          />
        </div>

        <Button size="sm" onClick={onGenerate} disabled={isPending}>
          <FileText className="w-3.5 h-3.5" />
          {isPending ? "Generando…" : "Generar"}
        </Button>

        {docs.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            {docs.map((doc, i) => (
              <DocumentoLink key={`${doc.filename}-${i}`} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function DocumentoLink({ doc }: { doc: GeneratedDocument }) {
  const href = doc.content_base64
    ? `data:${doc.mime_type};base64,${doc.content_base64}`
    : doc.source_url;
  if (!href) return null;
  const isDownload = Boolean(doc.content_base64);
  return (
    <a
      href={href}
      download={isDownload ? doc.filename : undefined}
      target={isDownload ? undefined : "_blank"}
      rel={isDownload ? undefined : "noopener noreferrer"}
      className="flex items-center gap-2 text-[13px] text-primary hover:underline"
    >
      {isDownload ? (
        <Download className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
      )}
      <span className="truncate">{doc.filename}</span>
    </a>
  );
}
