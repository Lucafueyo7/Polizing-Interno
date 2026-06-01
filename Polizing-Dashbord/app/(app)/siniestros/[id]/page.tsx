import {
  getSiniestroFormRefs,
  nextSiniestroNumero,
} from "@/lib/data/siniestros";
import { SiniestroFormModal } from "../_components/siniestro-form-modal";

type SearchParams = Promise<{ modal?: string }>;

/**
 * Children slot del segmento dinámico. Por defecto invisible — la UI vive
 * en los slots `@list` y `@detail`. Pero si el usuario abre `?modal=create`
 * mientras está en `/siniestros/[id]`, montamos el formulario acá.
 */
export default async function SiniestroIdChildrenPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  if (sp.modal !== "create") return null;
  const [refs, defaultNumero] = await Promise.all([
    getSiniestroFormRefs(),
    nextSiniestroNumero(),
  ]);
  return <SiniestroFormModal refs={refs} defaultNumero={defaultNumero} />;
}
