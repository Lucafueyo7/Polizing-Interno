import { PageHeader } from "@/components/shared/page-header";
import {
  getDashboardKPIs,
  getDistribucionAseguradoras,
  getSiniestrosPendientes,
} from "@/lib/data/kpis";
import { TODAY_ISO } from "@/lib/format/date";
import { fmtLongDate } from "@/lib/format/long-date";
import { ActividadReciente } from "./_components/actividad-reciente";
import { DashboardActions } from "./_components/dashboard-actions";
import { DistribucionAseguradoras } from "./_components/distribucion-aseguradoras";
import { KpiGrid } from "./_components/kpi-grid";
import { SiniestrosPendientes } from "./_components/siniestros-pendientes";

export default async function DashboardPage() {
  const [kpis, pendientes, distribucion] = await Promise.all([
    getDashboardKPIs(),
    getSiniestrosPendientes(),
    getDistribucionAseguradoras(),
  ]);

  return (
    <>
      <PageHeader
        title="Panel de Control"
        subtitle={`Resumen ejecutivo · ${fmtLongDate(TODAY_ISO)}`}
        actions={<DashboardActions />}
      />

      <KpiGrid kpis={kpis} />

      <section className="mt-5">
        <SiniestrosPendientes items={pendientes} />
      </section>

      <section className="mt-5 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        <DistribucionAseguradoras items={distribucion} />
        <ActividadReciente />
      </section>
    </>
  );
}
