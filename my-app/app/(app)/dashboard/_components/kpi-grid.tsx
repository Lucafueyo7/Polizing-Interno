import { AlertIcon, Coins, Shield, Users } from "@/components/icons";
import { fmtAR } from "@/lib/format/currency";
import { fmtNum } from "@/lib/format/number";
import type { DashboardKPIs } from "@/lib/data/types";
import { KpiCard } from "./kpi-card";

const SPARKS = {
  clientes: [42, 44, 45, 47, 48, 49, 50, 51],
  polizas: [120, 124, 126, 128, 130, 132, 130, 134],
  siniestros: [8, 9, 7, 8, 6, 5, 6, 5],
  prima: [18, 19, 20, 22, 23, 24, 26, 28],
} as const;

export function KpiGrid({ kpis }: { kpis: DashboardKPIs }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        label="Clientes activos"
        icon={Users}
        value={fmtNum(kpis.clientesActivos)}
        trend={{ direction: "up", text: "+3 este mes" }}
        sparkline={{ values: [...SPARKS.clientes], color: "var(--brand-success)" }}
      />
      <KpiCard
        label="Pólizas vigentes"
        icon={Shield}
        value={fmtNum(kpis.polizasVigentes)}
        trend={{ direction: "up", text: "+12 vs. mes ant." }}
        sparkline={{ values: [...SPARKS.polizas], color: "var(--primary)" }}
      />
      <KpiCard
        label="Siniestros en trámite"
        icon={AlertIcon}
        value={fmtNum(kpis.siniestrosTramite)}
        trend={{ direction: "down", text: "−2 vs. semana ant." }}
        sparkline={{ values: [...SPARKS.siniestros], color: "var(--brand-warn)" }}
      />
      <KpiCard
        label="Prima mensual"
        icon={Coins}
        value={fmtAR(kpis.primaMensual)}
        valueClassName="text-[22px]"
        trend={{ direction: "up", text: "+8,4% YoY" }}
        sparkline={{ values: [...SPARKS.prima], color: "var(--brand-info)" }}
      />
    </div>
  );
}
