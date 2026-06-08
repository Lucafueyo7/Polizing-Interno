import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

const TABS: { key: PolizaTab; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "vigente", label: "Activas" },
  { key: "porVencer", label: "Próximas a vencer" },
  { key: "vencida", label: "Vencidas" },
  { key: "renovada", label: "Renovadas" },
  { key: "anulada", label: "Anuladas" },
];

type SortField = "numero" | "cliente" | "aseguradora";

type SearchParams = Promise<{
  q?: string;
  tab?: string;
  tipo?: string;
  aseguradora?: string;
  modal?: string;
  newForCliente?: string;
  page?: string;
  sortBy?: string;
  sortDir?: string;
}>;

function parseTab(raw: string | undefined): PolizaTab {
  if (raw === "vigente" || raw === "proxima" || raw === "porVencer" || raw === "renovada" || raw === "vencida" || raw === "anulada") return raw;
  return "all";
}

function buildHref(filters: PolizasFilters, page: number): string {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.tipo) sp.set("tipo", filters.tipo);
  if (filters.aseguradoraId !== undefined)
    sp.set("aseguradora", String(filters.aseguradoraId));
  if (filters.tab && filters.tab !== "all") sp.set("tab", filters.tab);
  if (filters.sortBy) sp.set("sortBy", filters.sortBy);
  if (filters.sortDir) sp.set("sortDir", filters.sortDir);
  if (page > 0) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/polizas?${qs}` : "/polizas";
}

function parseSortField(raw: string | undefined): SortField | undefined {
  if (raw === "numero" || raw === "cliente" || raw === "aseguradora") return raw;
  return undefined;
}

function parseSortDir(raw: string | undefined): "asc" | "desc" | undefined {
  return raw === "asc" || raw === "desc" ? raw : undefined;
}

export default async function PolizasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const tab = parseTab(sp.tab);
  const sortBy = parseSortField(sp.sortBy);
  const sortDir = parseSortDir(sp.sortDir);

  const filters: PolizasFilters = {
    tab,
    q: sp.q?.trim() || undefined,
    tipo: sp.tipo || undefined,
    aseguradoraId: sp.aseguradora ? Number(sp.aseguradora) : undefined,
    sortBy,
    sortDir,
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
        <PolizasFilterbar
          initialQ={filters.q ?? ""}
          initialTipo={filters.tipo ?? ""}
          initialAseguradora={
            filters.aseguradoraId ? String(filters.aseguradoraId) : ""
          }
          tipos={refs.tiposSeguro}
          aseguradoras={refs.aseguradoras}
        />

        <div className="flex items-center gap-1.5 px-5 py-2.5 border-t border-border overflow-x-hidden">
          {TABS.map((t) => {
            const isActive = tab === t.key;
            return (
              <Link
                key={t.key}
                href={buildHref({ ...filters, tab: t.key }, 0)}
                className={cn(
                  "px-3 py-1 text-[12.5px] rounded-full font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-brand text-brand-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-brand-surface-hover",
                )}
              >
                {t.label}
                <span className="ml-1.5 opacity-70">
                  {counts[t.key]}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="overflow-x-hidden border-t border-border">
          <PolizasTable
            rows={rows}
            total={totalFiltered}
            page={page}
            totalPages={totalPages}
            prevHref={page > 0 ? buildHref(filters, page - 1) : null}
            nextHref={page < totalPages - 1 ? buildHref(filters, page + 1) : null}
            sortBy={sortBy}
            sortDir={sortDir}
            buildSortHref={(field, dir) => buildHref({ ...filters, sortBy: field, sortDir: dir }, 0)}
          />
        </div>
      </Card>

      {showCreate && (
        <PolizaFormModal mode="create" refs={refs} newForCliente={newForCliente} />
      )}
    </>
  );
}
