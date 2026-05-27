import { PageHeader } from "@/components/shared/page-header";
import { fmtNum } from "@/lib/format/number";
import { getNoticias } from "@/lib/data/noticias";
import { NoticiasEmptyState } from "./_components/noticias-empty-state";
import { NoticiasGrid } from "./_components/noticias-grid";
import { RefreshNoticiasButton } from "./_components/refresh-noticias-button";

export default async function NoticiasPage() {
  const noticias = await getNoticias();

  return (
    <>
      <PageHeader
        title="Noticias"
        subtitle={
          noticias.length > 0
            ? `${fmtNum(noticias.length)} últimas noticias de Asegurando Digital`
            : "Últimas noticias de Asegurando Digital"
        }
        actions={<RefreshNoticiasButton />}
      />

      {noticias.length > 0 ? (
        <NoticiasGrid items={noticias} />
      ) : (
        <NoticiasEmptyState />
      )}
    </>
  );
}
