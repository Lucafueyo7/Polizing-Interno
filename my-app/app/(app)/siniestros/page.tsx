import { AlertIcon } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export default function SiniestrosPage() {
  return (
    <>
      <PageHeader
        title="Siniestros"
        subtitle="Bandeja de entrada · reportes vía WhatsApp procesados con IA."
      />
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <EmptyState
          icon={AlertIcon}
          title="Próximamente"
          subtitle="Inbox de siniestros — Etapa 7."
        />
      </div>
    </>
  );
}
