import { Inbox } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";

export default function DetailSlotPage() {
  return (
    <EmptyState
      icon={Inbox}
      title="Seleccioná un siniestro"
      subtitle="Elegí un caso de la lista para ver el detalle."
    />
  );
}
