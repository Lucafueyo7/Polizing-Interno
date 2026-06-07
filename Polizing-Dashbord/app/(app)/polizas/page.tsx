import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import {
  getPolizaCounts,
  getPolizaFormRefs,
  getPolizas,
  POLIZAS_PAGE_SIZE,
} from "@/lib/data/polizas";
import { fmtNum } from "@/lib/format/number";
import type { PolizaTab, PolizasFilters } from "@/lib/data/types";
import { PolizaFormModal } from "./_components/poliza-form-modal";
import { PolizasFilterbar } from "./_components/polizas-filterbar";
import { PolizasPageActions } from "./_components/polizas-page-actions";
import { PolizasTable } from "./_components/polizas-table";
import { PolizasTabs } from "./_components/polizas-tabs";

const TAB_VALUES: ReadonlyArray<PolizaTab> = [
  "all",
  "vigente",
  "proxima",
  "porVencer",
  "renovada",
  "vencida",
  "anulada",
];

function parseTab(raw: string | undefined): PolizaTab {
  return (TAB_VALUES as ReadonlyArray<string>).includes(raw ?? "")
    ? (raw as PolizaTab)
    : "all";
}

type SearchParams = Promise<{
  tab?: string;
  q?: string;
  tipo?: string;
  aseguradora?: string;
  modal?: string;
  newForCliente?: string;
  page?: string;
}>;

function buildHref(filters: PolizasFilters, page: number): string {
  const sp = new URLSearchParams();
  if (filters.tab && filters.tab !== "all") sp.set("tab", filters.tab);
  if (filters.q) sp.set("q", filters.q);
  if (filters.tipo) sp.set("tipo", filters.tipo);
  if (filters.aseguradoraId !== undefined)
    sp.set("aseguradora", String(filters.aseguradoraId));
  if (page > 0) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/polizas?${qs}` : "/polizas";
}

export default async function PolizasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const tab = parseTab(sp.tab);
  const filters: PolizasFilters = {
    tab,
    q: sp.q?.trim() || undefined,
    tipo: sp.tipo || undefined,
    aseguradoraId: sp.aseguradora ? Number(sp.aseguradora) : undefined,
  };
  const page = Math.max(0, Number(sp.page) || 0);

  const [{ rows, total: totalFiltered }, counts, refs] = await Promise.all([
    getPolizas(filters, page),
    getPolizaCounts({
      q: filters.q,
      tipo: filters.tipo,
      aseguradoraId: filters.aseguradoraId,
    }),
    getPolizaFormRefs(),
  ]);

  const totalPages = Math.ceil(totalFiltered / POLIZAS_PAGE_SIZE);

  const showCreate = sp.modal === "create";
  const newForCliente = sp.newForCliente ? Number(sp.newForCliente) : undefined;

  return (
    <>
      <PageHeader
        title="Pólizas"
        subtitle={`${fmtNum(counts.all)} pólizas en cartera · ${fmtNum(counts.vigente)} vigentes · ${fmtNum(counts.porVencer)} próximas a vencer`}
        actions={<PolizasPageActions />}
      />

      <Card className="overflow-hidden p-0 gap-0">
        <PolizasTabs active={tab} counts={counts} />
        <PolizasFilterbar
          initialQ={filters.q ?? ""}
          initialTipo={filters.tipo ?? ""}
          initialAseguradora={
            filters.aseguradoraId ? String(filters.aseguradoraId) : ""
          }
          tipos={refs.tiposSeguro}
          aseguradoras={refs.aseguradoras}
        />
        <div className="border-t border-border">
          <PolizasTable
            rows={rows}
            total={totalFiltered}
            page={page}
            totalPages={totalPages}
            prevHref={page > 0 ? buildHref(filters, page - 1) : null}
            nextHref={page < totalPages - 1 ? buildHref(filters, page + 1) : null}
          />
        </div>
      </Card>

      {showCreate && (
        <PolizaFormModal mode="create" refs={refs} newForCliente={newForCliente} />
      )}
    </>
  );
}
