import { Wallet } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function PagosPage() {
  return (
    <>
      <PageHeader
        title="Pagos masivos"
        subtitle="Validación de comprobantes — exclusivo clientes corporativos."
      />
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <EmptyState
          icon={Wallet}
          title="Próximamente"
          subtitle="Validación de pagos — Etapa 8."
        />
      </div>
    </>
  );
}
