import { redirect } from "next/navigation";
import {
  getPrimerSiniestro,
  getSiniestroFormRefs,
  nextSiniestroNumero,
} from "@/lib/data/siniestros";
import { SiniestroFormModal } from "./_components/siniestro-form-modal";

type SearchParams = Promise<{ modal?: string; tab?: string; q?: string }>;

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
  if (primero) {
    const params = new URLSearchParams();
    if (sp.tab) params.set("tab", sp.tab);
    if (sp.q) params.set("q", sp.q);
    const qs = params.toString();
    redirect(qs ? `/siniestros/${primero.id}?${qs}` : `/siniestros/${primero.id}`);
  }
  return null;
}
