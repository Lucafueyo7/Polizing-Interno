import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getPagoById } from "@/lib/data/pagos";
import { PagoDetail } from "../_components/pago-detail";

export default async function DetailIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const pago = await getPagoById(id);
  if (!pago) notFound();

  return <PagoDetail pago={pago} />;
}
