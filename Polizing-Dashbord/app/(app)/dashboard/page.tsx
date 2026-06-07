import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { getActividadReciente } from "@/lib/data/actividad";
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
import { KpiGridSkeleton } from "./_components/kpi-grid-skeleton";
import { SiniestrosPendientes } from "./_components/siniestros-pendientes";

async function KpiGridWrapper() {
  const kpis = await getDashboardKPIs();

  return <KpiGrid kpis={kpis} />;
}

export default async function DashboardPage() {
  const [pendientes, distribucion, actividad] = await Promise.all([
    getSiniestrosPendientes(),
    getDistribucionAseguradoras(),
    getActividadReciente(),
  ]);

  return (
    <>
      <PageHeader
        title="Panel de Control"
        subtitle={`Resumen ejecutivo · ${fmtLongDate(TODAY_ISO)}`}
        actions={<DashboardActions />}
      />

      <Suspense fallback={<KpiGridSkeleton />}>
        <KpiGridWrapper />
      </Suspense>

      <section className="mt-5">
        <SiniestrosPendientes items={pendientes} />
      </section>

      <section className="mt-5 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        <DistribucionAseguradoras items={distribucion} />
        <ActividadReciente items={actividad} />
      </section>
    </>
  );
}
