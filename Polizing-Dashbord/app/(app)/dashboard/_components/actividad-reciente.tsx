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

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type ActivityRow = {
  id: string;
  icon: IconComponent;
  tone: "success" | "warn" | "info" | "whatsapp";
  title: string;
  meta: string;
  when: string;
};

// TODO: connect to audit log table once `audit_events` exists.
const ROWS: ActivityRow[] = [
  {
    id: "1",
    icon: ShieldCheck,
    tone: "success",
    title: "Póliza HOG-309218 emitida",
    meta: "Agustina Vázquez · La Federal Seguros",
    when: "hace 2 h",
  },
  {
    id: "2",
    icon: WhatsApp,
    tone: "whatsapp",
    title: "Nuevo siniestro reportado",
    meta: "Sofía Mansilla · Choque trasero",
    when: "hace 4 h",
  },
  {
    id: "3",
    icon: CheckCircle,
    tone: "success",
    title: "Pago validado",
    meta: "Frigorífico Las Heras · AR$ 5,21M",
    when: "hace 6 h",
  },
  {
    id: "4",
    icon: Edit,
    tone: "info",
    title: "Cliente actualizado",
    meta: "Distribuidora Pampa Verde",
    when: "ayer",
  },
  {
    id: "5",
    icon: Refresh,
    tone: "info",
    title: "Renovación procesada",
    meta: "P-2024-0902 · Vida Individual",
    when: "ayer",
  },
];

const TONE_CLASSES: Record<ActivityRow["tone"], string> = {
  success: "bg-brand-success-soft text-brand-success",
  warn: "bg-brand-warn-soft text-brand-warn",
  info: "bg-brand-info-soft text-brand-info",
  whatsapp: "bg-brand-whatsapp-soft text-brand-whatsapp",
};

export function ActividadReciente() {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">
          Actividad reciente
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <li
              key={row.id}
              className="flex items-start gap-3 px-5 py-3.5"
            >
              <span
                className={cn(
                  "w-9 h-9 rounded-lg grid place-items-center shrink-0",
                  TONE_CLASSES[row.tone],
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
        })}
      </ul>
    </Card>
  );
}
