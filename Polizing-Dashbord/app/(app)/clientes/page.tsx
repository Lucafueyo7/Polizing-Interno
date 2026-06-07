import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { prisma } from "@/lib/prisma";
import {
  CLIENTES_PAGE_SIZE,
  getClientes,
  type ClientesFilters,
} from "@/lib/data/clientes";
import { fmtNum } from "@/lib/format/number";
import { ClientesFilterbar } from "./_components/clientes-filterbar";
import { ClientesPageActions } from "./_components/clientes-page-actions";
import { ClientesTable } from "./_components/clientes-table";
import { ClienteFormModal } from "./_components/cliente-form-modal";

type SearchParams = Promise<{
  q?: string;
  tipo?: string;
  estado?: string;
  aseguradoraId?: string;
  sortBy?: string;
  sortDir?: string;
  modal?: string;
  id?: string;
  page?: string;
}>;

function parseFilters(params: Awaited<SearchParams>): ClientesFilters {
  const filters: ClientesFilters = {};
  if (params.q?.trim()) filters.q = params.q.trim();
  if (params.tipo === "corp" || params.tipo === "normal") filters.tipo = params.tipo;
  if (params.estado === "activo" || params.estado === "baja") filters.estado = params.estado;
  if (params.aseguradoraId?.trim()) filters.aseguradoraId = params.aseguradoraId.trim();
  if (params.sortBy === "label" || params.sortBy === "ident" || params.sortBy === "prima" || params.sortBy === "polizas") filters.sortBy = params.sortBy;
  if (params.sortDir === "asc" || params.sortDir === "desc") filters.sortDir = params.sortDir;
  return filters;
}

function buildHref(filters: ClientesFilters, page: number): string {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.tipo) sp.set("tipo", filters.tipo);
  if (filters.estado) sp.set("estado", filters.estado);
  if (filters.aseguradoraId) sp.set("aseguradoraId", filters.aseguradoraId);
  if (filters.sortBy) sp.set("sortBy", filters.sortBy);
  if (filters.sortDir) sp.set("sortDir", filters.sortDir);
  if (page > 0) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/clientes?${qs}` : "/clientes";
}

function buildSortHref(filters: ClientesFilters, sortBy: NonNullable<ClientesFilters["sortBy"]>, sortDir: NonNullable<ClientesFilters["sortDir"]>): string {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.tipo) sp.set("tipo", filters.tipo);
  if (filters.estado) sp.set("estado", filters.estado);
  if (filters.aseguradoraId) sp.set("aseguradoraId", filters.aseguradoraId);
  sp.set("sortBy", sortBy);
  sp.set("sortDir", sortDir);
  const qs = sp.toString();
  return qs ? `/clientes?${qs}` : "/clientes";
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const page = Math.max(0, Number(params.page) || 0);
  const aseguradoras = await prisma.empresas_aseguradoras.findMany({
    select: { id: true, razon_social: true },
    orderBy: { razon_social: "asc" },
  });

  const [{ rows, total: totalFiltered }, { rows: allRows, total: totalAll }] =
    await Promise.all([getClientes(filters, page), getClientes()]);

  const corporativos = allRows.filter((c) => c.tipo === "corp").length;
  const particulares = totalAll - corporativos;
  const totalPages = Math.ceil(totalFiltered / CLIENTES_PAGE_SIZE);

  const showCreate = params.modal === "create";

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={`${fmtNum(totalAll)} clientes registrados · ${fmtNum(corporativos)} corporativos · ${fmtNum(particulares)} particulares`}
        actions={<ClientesPageActions />}
      />

      <Card className="overflow-hidden p-0 gap-0">
        <ClientesFilterbar
          initialQ={filters.q ?? ""}
          initialTipo={filters.tipo ?? "all"}
          initialEstado={filters.estado ?? "all"}
          initialAseguradoraId={filters.aseguradoraId ?? "all"}
          aseguradoras={aseguradoras}
        />
        <div className="border-t border-border">
          <ClientesTable
            rows={rows}
            total={totalFiltered}
            page={page}
            totalPages={totalPages}
            prevHref={page > 0 ? buildHref(filters, page - 1) : null}
            nextHref={page < totalPages - 1 ? buildHref(filters, page + 1) : null}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            buildSortHref={(sortBy, sortDir) => buildSortHref(filters, sortBy, sortDir)}
          />
        </div>
      </Card>

      {showCreate && <ClienteFormModal mode="create" />}
    </>
  );
}
