import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import {
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
  modal?: string;
  id?: string;
}>;

function parseFilters(params: Awaited<SearchParams>): ClientesFilters {
  const filters: ClientesFilters = {};
  if (params.q?.trim()) filters.q = params.q.trim();
  if (params.tipo === "corp" || params.tipo === "normal") filters.tipo = params.tipo;
  if (params.estado === "activo" || params.estado === "baja") filters.estado = params.estado;
  return filters;
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);

  const [rows, allRows] = await Promise.all([
    getClientes(filters),
    getClientes(),
  ]);

  const corporativos = allRows.filter((c) => c.tipo === "corp").length;
  const particulares = allRows.length - corporativos;

  const showCreate = params.modal === "create";

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={`${fmtNum(allRows.length)} clientes registrados · ${fmtNum(corporativos)} corporativos · ${fmtNum(particulares)} particulares`}
        actions={<ClientesPageActions />}
      />

      <Card className="overflow-hidden p-0 gap-0">
        <ClientesFilterbar
          initialQ={filters.q ?? ""}
          initialTipo={filters.tipo ?? "all"}
          initialEstado={filters.estado ?? "all"}
        />
        <div className="border-t border-border">
          <ClientesTable rows={rows} total={allRows.length} />
        </div>
      </Card>

      {showCreate && <ClienteFormModal mode="create" />}
    </>
  );
}
