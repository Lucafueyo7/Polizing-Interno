import { AlertCircle } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Cliente no encontrado"
      subtitle="El registro que buscás no existe o fue eliminado."
    />
  );
}
