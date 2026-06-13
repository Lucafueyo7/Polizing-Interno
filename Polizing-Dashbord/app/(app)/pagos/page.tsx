import { redirect } from "next/navigation";
import { getPrimerPago } from "@/lib/data/pagos";
import type { PagoTab } from "@/lib/data/types";

type SearchParams = Promise<{ tab?: string }>;

const TAB_VALUES: ReadonlyArray<PagoTab> = ["all", "pendiente", "validado", "rechazado"];

function parseTab(raw: string | undefined): PagoTab {
  return (TAB_VALUES as ReadonlyArray<string>).includes(raw ?? "")
    ? (raw as PagoTab)
    : "pendiente";
}

export default async function PagosIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const tab = parseTab(sp.tab);
  const primero = await getPrimerPago(tab);
  if (primero) {
    const qs = sp.tab ? `?tab=${sp.tab}` : "";
    redirect(`/pagos/${primero.id}${qs}`);
  }
  return null;
}
