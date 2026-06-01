import { Wallet } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { getPagos } from "@/lib/data/pagos";
import type { PagoTab } from "@/lib/data/types";
import { PagoRow } from "./pago-row";

const TAB_VALUES: ReadonlyArray<PagoTab> = [
  "all",
  "pendiente",
  "validado",
  "rechazado",
];

function parseTab(raw: string | undefined): PagoTab {
  return (TAB_VALUES as ReadonlyArray<string>).includes(raw ?? "")
    ? (raw as PagoTab)
    : "pendiente";
}

export async function PagosList({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = parseTab(searchParams.tab);
  const items = await getPagos({ tab });

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Sin comprobantes"
        subtitle="No hay pagos en este filtro."
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      {items.map((pago) => (
        <PagoRow key={pago.id} pago={pago} />
      ))}
    </div>
  );
}
