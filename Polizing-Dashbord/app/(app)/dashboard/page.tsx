import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { getActividadReciente } from "@/lib/data/actividad";
import {
  getDashboardKPIs,
  getDistribucionAseguradoras,
  getSiniestrosPendientes,
} from "@/lib/data/kpis";
import { Card } from "@/components/ui/card";
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

async function SiniestrosPendientesWrapper() {
  const items = await getSiniestrosPendientes();
  return <SiniestrosPendientes items={items} />;
}

async function DistribucionWrapper() {
  const items = await getDistribucionAseguradoras();
  return <DistribucionAseguradoras items={items} />;
}

async function ActividadWrapper() {
  const items = await getActividadReciente();
  return <ActividadReciente items={items} />;
}

function GenericCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <div className="p-5 space-y-4 animate-pulse">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="h-3 w-36 rounded bg-muted" />
        <div className="space-y-3 pt-2">
          <div className="h-12 rounded-lg bg-muted" />
          <div className="h-12 rounded-lg bg-muted" />
          <div className="h-12 rounded-lg bg-muted" />
        </div>
      </div>
    </Card>
  );
}

export default async function DashboardPage() {
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

      <div className="mt-5">
        <Suspense fallback={<GenericCardSkeleton />}>
          <SiniestrosPendientesWrapper />
        </Suspense>
      </div>

      <section className="mt-5 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        <Suspense fallback={<GenericCardSkeleton />}>
          <DistribucionWrapper />
        </Suspense>
        <Suspense fallback={<GenericCardSkeleton />}>
          <ActividadWrapper />
        </Suspense>
      </section>
    </>
  );
}
