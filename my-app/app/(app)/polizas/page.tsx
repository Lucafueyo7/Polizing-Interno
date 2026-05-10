import { Shield } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function PolizasPage() {
  return (
    <>
      <PageHeader
        title="Pólizas"
        subtitle="Cartera de pólizas vigentes, próximas a vencer y vencidas."
      />
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <EmptyState
          icon={Shield}
          title="Próximamente"
          subtitle="Listado y ABM de pólizas — Etapa 6."
        />
      </div>
    </>
  );
}
