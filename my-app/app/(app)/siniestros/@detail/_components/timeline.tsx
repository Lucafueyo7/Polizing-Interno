import { Sparkles, WhatsApp } from "@/components/icons";
import { timeAgo } from "@/lib/format/time-ago";
import type { SiniestroFull } from "@/lib/data/types";

export function Timeline({ siniestro }: { siniestro: SiniestroFull }) {
  const reportoText = `${timeAgo(siniestro.fechaReporte)} · vía WhatsApp Business · ${siniestro.cliente.label}`;

  // TODO: hook to real audit_events table once exists.
  const events: Array<{
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    iconBg: string;
    title: string;
    meta: string;
    show: boolean;
  }> = [
    {
      icon: Sparkles,
      iconBg: "bg-brand-info text-white",
      title: "IA procesó adjuntos",
      meta: `${timeAgo(siniestro.fechaReporte)} · clasificación automática + extracción de datos`,
      show: siniestro.aiSummary !== null,
    },
    {
      icon: WhatsApp,
      iconBg: "bg-brand-whatsapp text-white",
      title: "Reporte recibido",
      meta: reportoText,
      show: true,
    },
  ];

  const visible = events.filter((e) => e.show);

  return (
    <section>
      <h4 className="text-[12px] font-semibold tracking-[0.04em] uppercase text-muted-foreground mb-3">
        Línea de tiempo
      </h4>
      <ol className="flex flex-col gap-3">
        {visible.map((event, i) => {
          const Icon = event.icon;
          return (
            <li key={i} className="flex items-start gap-3">
              <span
                className={`w-6 h-6 rounded-full grid place-items-center shrink-0 ${event.iconBg}`}
                aria-hidden="true"
              >
                <Icon className="w-3 h-3" />
              </span>
              <div className="text-[12.5px]">
                <b className="text-foreground">{event.title}</b>
                <div className="text-muted-foreground mt-0.5">{event.meta}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
