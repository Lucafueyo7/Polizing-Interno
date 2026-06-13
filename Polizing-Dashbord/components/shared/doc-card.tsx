/* eslint-disable @next/next/no-img-element */
import { FileText, ImageIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import type { AttachmentDoc } from "@/lib/data/types";

export function DocCard({ doc }: { doc: AttachmentDoc }) {
  const Icon = doc.tipo === "img" ? ImageIcon : FileText;
  const showImage = doc.tipo === "img" && doc.url.length > 0;

  return (
    <article className="border border-border rounded-lg overflow-hidden bg-brand-surface-2 transition-colors group-hover:border-primary/50">
      <div className="relative aspect-[4/3] bg-secondary grid place-items-center text-muted-foreground overflow-hidden">
        {showImage ? (
          <img
            src={doc.url}
            alt={doc.nombre}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <Icon className="w-7 h-7" />
        )}
        {doc.procesadoIA && (
          <Badge variant="info" className="absolute top-1.5 right-1.5 h-4 text-[9px]">
            IA
          </Badge>
        )}
      </div>
      <div className="px-3 py-2 border-t border-border">
        <div className="text-[12px] font-medium truncate">{doc.nombre}</div>
        {doc.tamano && (
          <div className="text-[10.5px] text-muted-foreground mt-0.5">
            {doc.tamano}
            {doc.procesadoIA && " · datos extraídos"}
          </div>
        )}
      </div>
    </article>
  );
}
