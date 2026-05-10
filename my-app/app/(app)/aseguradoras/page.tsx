import { Building } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function AseguradorasPage() {
  return (
    <>
      <PageHeader
        title="Aseguradoras"
        subtitle="Compañías aseguradoras con las que operamos."
      />
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <EmptyState
          icon={Building}
          title="Próximamente"
          subtitle="Grid de aseguradoras — Etapa 5."
        />
      </div>
    </>
  );
}
