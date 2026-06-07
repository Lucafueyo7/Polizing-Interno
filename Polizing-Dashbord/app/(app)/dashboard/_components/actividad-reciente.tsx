import type { ComponentType, SVGProps } from "react";
import {
  CheckCircle,
  Edit,
  Refresh,
  ShieldCheck,
  WhatsApp,
} from "@/components/icons";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/data/actividad";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const TONE_CLASSES = {
  siniestro: "bg-brand-warn-soft text-brand-warn",
  poliza: "bg-brand-success-soft text-brand-success",
  pago: "bg-brand-info-soft text-brand-info",
} as const;

const ICONS: Record<ActivityItem["type"], IconComponent> = {
  siniestro: ShieldCheck,
  poliza: Refresh,
  pago: CheckCircle,
};

export function ActividadReciente({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">
          Actividad reciente
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {items.length === 0 ? (
          <li className="px-5 py-8 text-sm text-muted-foreground text-center">
            Sin actividad reciente.
          </li>
        ) : (
          items.map((row) => {
            const Icon = ICONS[row.type];
            return (
              <li
                key={row.id}
                className="flex items-start gap-3 px-5 py-3.5"
              >
                <span
                  className={cn(
                    "w-9 h-9 rounded-lg grid place-items-center shrink-0",
                    TONE_CLASSES[row.type],
                  )}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-foreground truncate">
                    {row.title}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                    {row.meta}
                  </div>
                </div>
                <span className="text-[11.5px] text-muted-foreground shrink-0 mt-0.5">
                  {row.when}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </Card>
  );
}
