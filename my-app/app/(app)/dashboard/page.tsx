import { Dashboard as DashboardIcon } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Panel de Control"
        subtitle="Resumen ejecutivo · Jueves 8 de mayo de 2026"
      />
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <EmptyState
          icon={DashboardIcon}
          title="Dashboard — próximamente"
          subtitle="Los KPIs reales se conectarán en la próxima etapa."
        />
      </div>
    </>
  );
}
