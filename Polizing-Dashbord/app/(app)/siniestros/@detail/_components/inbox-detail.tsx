import { WhatsApp } from "@/components/icons";
import { ClienteAvatar } from "@/components/shared/cliente-avatar";
import { SiniestroBadge } from "@/components/shared/status-badges/siniestro-badge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fmtDate } from "@/lib/format/date";
import { timeAgo } from "@/lib/format/time-ago";
import type { SiniestroFull } from "@/lib/data/types";
import { DocsGrid } from "@/components/shared/docs-grid";
import { DetailActions } from "./detail-actions";
import { MarkAsRead } from "./mark-as-read";
import { PolizaVinculada } from "./poliza-vinculada";
import { Timeline } from "./timeline";

export function InboxDetail({ siniestro }: { siniestro: SiniestroFull }) {
  return (
    <article className="flex flex-col h-full">
      <MarkAsRead id={siniestro.id} leidoPorMi={siniestro.leidoPorMi} />

      <header className="px-6 pt-6 pb-5 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <SiniestroBadge estado={siniestro.estado} />
          <Badge variant="whatsapp" className="h-4 px-1.5 text-[10px]">
            <WhatsApp className="w-2.5 h-2.5" />
            WhatsApp
          </Badge>
          <span className="ml-auto font-mono text-[12px] text-muted-foreground">
            {siniestro.numero}
          </span>
        </div>

        <h2 className="text-[19px] font-semibold tracking-[-0.015em] leading-tight">
          {siniestro.titulo ?? "Siniestro sin título"}
        </h2>

        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ClienteAvatar letters={siniestro.cliente.avatarLetters} size="sm" />
            <div>
              <div className="text-[13px] font-medium">
                {siniestro.cliente.label}
              </div>
              <div className="font-mono text-[11.5px] text-muted-foreground">
                {siniestro.cliente.ident}
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="h-8" />

          <div>
            <div className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
              Ocurrencia
            </div>
            <div className="font-mono text-[13px] mt-0.5">
              {fmtDate(siniestro.fechaOcurrencia)}
            </div>
          </div>

          <div>
            <div className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
              Reportado
            </div>
            <div className="font-mono text-[13px] mt-0.5">
              {timeAgo(siniestro.fechaReporte)}
            </div>
          </div>

          <div className="ml-auto">
            <DetailActions id={siniestro.id} estado={siniestro.estado} />
          </div>
        </div>
      </header>

      <div className="px-6 py-5 flex flex-col gap-6 overflow-y-auto">
        <PolizaVinculada poliza={siniestro.poliza} />

        {siniestro.descripcion && (
          <section>
            <h4 className="text-[12px] font-semibold tracking-[0.04em] uppercase text-muted-foreground mb-1.5">
              Descripción
            </h4>
            <p className="text-[13px] leading-relaxed">{siniestro.descripcion}</p>
          </section>
        )}

        <DocsGrid docs={siniestro.docs} />

        <Timeline siniestro={siniestro} />
      </div>
    </article>
  );
}
