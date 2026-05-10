import type { SiniestroDoc } from "@/lib/data/types";
import { DocCard } from "./doc-card";

export function DocsGrid({ docs }: { docs: SiniestroDoc[] }) {
  return (
    <section>
      <h4 className="text-[12px] font-semibold tracking-[0.04em] uppercase text-muted-foreground mb-2">
        Documentos adjuntos · {docs.length}
      </h4>
      {docs.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">
          Sin documentos adjuntos.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
          {docs.map((doc) => (
            <DocCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </section>
  );
}
