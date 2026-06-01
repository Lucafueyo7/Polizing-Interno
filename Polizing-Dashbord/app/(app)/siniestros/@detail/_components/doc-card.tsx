import { FileText, ImageIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import type { SiniestroDoc } from "@/lib/data/types";

export function DocCard({ doc }: { doc: SiniestroDoc }) {
  const Icon = doc.tipo === "img" ? ImageIcon : FileText;
  return (
    <article className="border border-border rounded-lg overflow-hidden bg-brand-surface-2">
      <div className="relative aspect-[4/3] bg-secondary grid place-items-center text-muted-foreground">
        <Icon className="w-7 h-7" />
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
