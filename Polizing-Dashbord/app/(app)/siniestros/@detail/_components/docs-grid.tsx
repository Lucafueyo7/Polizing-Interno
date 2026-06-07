"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Download } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SiniestroDoc } from "@/lib/data/types";
import { DocCard } from "./doc-card";

export function DocsGrid({ docs }: { docs: SiniestroDoc[] }) {
  const [selected, setSelected] = useState<SiniestroDoc | null>(null);

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
            <button
              key={doc.id}
              type="button"
              onClick={() => setSelected(doc)}
              disabled={doc.url.length === 0}
              className="group block text-left disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            >
              <DocCard doc={doc} />
            </button>
          ))}
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="w-full max-w-[min(calc(100%-2rem),680px)]">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{selected?.nombre}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="flex flex-col gap-3 min-w-0">
              {selected.tipo === "img" ? (
                <div className="flex items-center justify-center bg-secondary rounded-lg overflow-hidden">
                  <img
                    src={selected.url}
                    alt={selected.nombre}
                    className="max-w-full max-h-[70dvh] object-contain"
                  />
                </div>
              ) : (
                <iframe
                  src={selected.url}
                  title={selected.nombre}
                  className="w-full h-[70dvh] rounded-lg"
                />
              )}

              <div className="flex items-center justify-between gap-3">
                {selected.tamano && (
                  <span className="text-[12px] text-muted-foreground truncate">
                    {selected.tamano}
                  </span>
                )}
                <a
                  href={selected.downloadUrl}
                  download={selected.nombre}
                  className={buttonVariants({ size: "sm", className: "ml-auto shrink-0" })}
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
