import { redirect } from "next/navigation";
import {
  getPrimerSiniestro,
  getSiniestroFormRefs,
  nextSiniestroNumero,
} from "@/lib/data/siniestros";
import { SiniestroFormModal } from "./_components/siniestro-form-modal";

type SearchParams = Promise<{ modal?: string }>;

export default async function SiniestrosIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  if (sp.modal === "create") {
    const [refs, defaultNumero] = await Promise.all([
      getSiniestroFormRefs(),
      nextSiniestroNumero(),
    ]);
    return <SiniestroFormModal refs={refs} defaultNumero={defaultNumero} />;
  }

  const primero = await getPrimerSiniestro();
  if (primero) redirect(`/siniestros/${primero.id}`);
  return null;
}
