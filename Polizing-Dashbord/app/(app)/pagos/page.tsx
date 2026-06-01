import { redirect } from "next/navigation";
import { getPrimerPago } from "@/lib/data/pagos";

export default async function PagosIndexPage() {
  const primero = await getPrimerPago();
  if (primero) redirect(`/pagos/${primero.id}`);
  return null;
}
