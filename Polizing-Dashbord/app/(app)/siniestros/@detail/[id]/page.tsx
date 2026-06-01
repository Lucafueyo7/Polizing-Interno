import { notFound } from "next/navigation";
import { getSiniestroById } from "@/lib/data/siniestros";
import { InboxDetail } from "../_components/inbox-detail";

export default async function DetailIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const siniestro = await getSiniestroById(id);
  if (!siniestro) notFound();

  return <InboxDetail siniestro={siniestro} />;
}
