import { Users } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function ClientesPage() {
  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Listado de particulares y corporativos."
      />
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <EmptyState
          icon={Users}
          title="Próximamente"
          subtitle="ABM y detalle de clientes — Etapa 4."
        />
      </div>
    </>
  );
}
