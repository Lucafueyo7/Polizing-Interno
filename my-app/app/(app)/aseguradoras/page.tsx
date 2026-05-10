import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { getAseguradoraById, getAseguradoras } from "@/lib/data/aseguradoras";
import { fmtNum } from "@/lib/format/number";
import { AseguradoraFormModal } from "./_components/aseguradora-form-modal";
import { AseguradorasGrid } from "./_components/aseguradoras-grid";
import { AseguradorasPageActions } from "./_components/aseguradoras-page-actions";

type SearchParams = Promise<{
  modal?: string;
  id?: string;
}>;

export default async function AseguradorasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const aseguradoras = await getAseguradoras();

  const showCreate = sp.modal === "create";
  let editTarget: Awaited<ReturnType<typeof getAseguradoraById>> | null = null;
  if (sp.modal === "edit" && sp.id) {
    const id = Number(sp.id);
    if (!Number.isInteger(id) || id <= 0) notFound();
    editTarget = await getAseguradoraById(id);
    if (!editTarget) notFound();
  }

  return (
    <>
      <PageHeader
        title="Aseguradoras"
        subtitle={`${fmtNum(aseguradoras.length)} compañías aseguradoras registradas`}
        actions={<AseguradorasPageActions />}
      />

      <AseguradorasGrid items={aseguradoras} />

      {showCreate && <AseguradoraFormModal mode="create" />}
      {editTarget && (
        <AseguradoraFormModal mode="edit" aseguradora={editTarget} />
      )}
    </>
  );
}
