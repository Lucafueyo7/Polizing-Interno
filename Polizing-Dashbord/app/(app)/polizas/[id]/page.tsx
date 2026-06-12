import { notFound } from "next/navigation";
import { getPolizaById, getPolizaFormRefs } from "@/lib/data/polizas";
import { PolizaDatosCard } from "./_components/poliza-datos-card";
import { PolizaDetailHeader } from "./_components/poliza-detail-header";
import { PolizaVigenciaCard } from "./_components/poliza-vigencia-card";
import { PolizaVinculacionCard } from "./_components/poliza-vinculacion-card";
import { PolizaFormModal } from "../_components/poliza-form-modal";

type SearchParams = Promise<{ modal?: string }>;

export default async function PolizaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [poliza, sp] = await Promise.all([getPolizaById(id), searchParams]);
  if (!poliza) notFound();

  const showEdit = sp.modal === "edit";
  const refs = showEdit ? await getPolizaFormRefs() : null;

  return (
    <>
      <PolizaDetailHeader poliza={poliza} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <PolizaVinculacionCard poliza={poliza} />
        <PolizaDatosCard poliza={poliza} />
        <PolizaVigenciaCard poliza={poliza} />
      </div>

      {showEdit && refs && (
        <PolizaFormModal mode="edit" poliza={poliza} refs={refs} />
      )}
    </>
  );
}
