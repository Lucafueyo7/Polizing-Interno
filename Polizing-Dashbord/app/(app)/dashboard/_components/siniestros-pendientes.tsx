"use client";

import Link from "next/link";
import { ChevronRight, WhatsApp } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/format/time-ago";
import type { SiniestroPendiente } from "@/lib/data/types";

export function SiniestrosPendientes({
  items,
}: {
  items: SiniestroPendiente[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">
            Siniestros pendientes de revisión
          </h3>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">
            Reportes recibidos vía WhatsApp procesados con IA
          </p>
        </div>
        <Link
          href="/siniestros"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "text-[12.5px]" })}
        >
          Bandeja
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Sin pendientes"
          subtitle="Todos los reportes fueron revisados."
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((s) => (
            <li key={s.id}>
              <Link
                href={`/siniestros/${s.id}`}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-brand-surface-hover transition-colors"
              >
                <span className="w-9 h-9 rounded-lg grid place-items-center bg-brand-whatsapp-soft text-brand-whatsapp shrink-0">
                  <WhatsApp className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-foreground truncate">
                    {s.titulo}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground mt-0.5">
                    <span className="truncate">{s.cliente.label}</span>
                    <span aria-hidden="true">·</span>
                    <span className="shrink-0">{s.docsCount} adjuntos</span>
                  </div>
                </div>
                <span className="text-[11.5px] text-muted-foreground shrink-0 mt-0.5">
                  {timeAgo(s.fechaReporte)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-brand-surface-2">
          <span className="text-[12.5px] text-muted-foreground">
            <b className="text-foreground">{items.length}</b> reportes esperan
            revisión humana
          </span>
          <Link href="/siniestros" className={buttonVariants({ size: "sm" })}>
            Revisar ahora
          </Link>
        </div>
      )}
    </Card>
  );
}
