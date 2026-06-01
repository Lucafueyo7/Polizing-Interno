import { Wallet } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";

export default function DetailSlotPage() {
  return (
    <EmptyState
      icon={Wallet}
      title="Seleccioná un comprobante"
      subtitle="Elegí un pago de la lista para revisar y validar."
    />
  );
}
