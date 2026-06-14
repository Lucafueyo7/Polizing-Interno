"use client";

import { ArrowUpRight, Calendar, Newspaper, Tag } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/format/time-ago";
import type { NoticiaListItem } from "@/lib/data/noticias";

export function NoticiaCard({ n }: { n: NoticiaListItem }) {
  return (
    <Card className="overflow-hidden p-0 gap-0 transition-shadow hover:ring-foreground/20">
      <a
        href={n.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-xl"
      >
        {n.imagenUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={n.imagenUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] w-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <Newspaper className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}

        <div className="px-5 py-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {n.categoria && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
                <Tag className="w-3 h-3" aria-hidden="true" />
                {n.categoria}
              </span>
            )}
            {n.publicadaEn && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" aria-hidden="true" />
                {timeAgo(n.publicadaEn)}
              </span>
            )}
          </div>

          <h3 className="text-[15px] font-semibold leading-snug text-foreground line-clamp-3">
            {n.titulo}
          </h3>

          {n.resumen && (
            <p className="text-[12.5px] text-muted-foreground leading-relaxed line-clamp-3">
              {n.resumen}
            </p>
          )}

          <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
            <span className="text-[11px] text-muted-foreground">
              {n.fuente}
            </span>
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-primary">
              Leer
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </a>
    </Card>
  );
}
