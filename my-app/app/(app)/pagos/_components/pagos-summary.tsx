import type { ComponentType, SVGProps } from "react";
import { Building, CheckCircle, Clock, Shield } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { fmtAR } from "@/lib/format/currency";
import { fmtNum } from "@/lib/format/number";
import { cn } from "@/lib/utils";
import type { PagosSummary } from "@/lib/data/types";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export function PagosSummary({ summary }: { summary: PagosSummary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <SummaryCard
        emphasis
        icon={Clock}
        label="Pendientes de validación"
        value={fmtAR(summary.pendienteTotal)}
        meta={`${fmtNum(summary.pendienteCount)} comprobantes`}
      />
      <SummaryCard
        icon={CheckCircle}
        label="Validados (acumulado)"
        value={fmtAR(summary.validadoTotal)}
        meta="estado validado"
        valueClassName="text-[22px]"
      />
      <SummaryCard
        icon={Shield}
        label="Pólizas alcanzadas"
        value={fmtNum(summary.polizasAlcanzadas)}
        meta={`en ${fmtNum(summary.operaciones)} operaciones`}
      />
      <SummaryCard
        icon={Building}
        label="Empresas"
        value={fmtNum(summary.empresas)}
        meta="con pagos en curso"
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  meta,
  emphasis = false,
  valueClassName,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  meta: string;
  emphasis?: boolean;
  valueClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "p-4 gap-2",
        emphasis &&
          "bg-primary text-primary-foreground border-transparent shadow-md",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 text-[12px] font-medium",
          emphasis ? "text-primary-foreground/85" : "text-muted-foreground",
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div
        className={cn(
          "font-semibold tracking-[-0.02em] leading-none",
          emphasis ? "text-primary-foreground" : "text-foreground",
          valueClassName ?? "text-[24px]",
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "text-[11.5px]",
          emphasis ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
      >
        {meta}
      </div>
    </Card>
  );
}
