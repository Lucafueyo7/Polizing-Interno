import { notFound } from "next/navigation";
import { Clock } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import {
  getClienteById,
  getClienteContrataciones,
  getClienteSiniestros,
} from "@/lib/data/clientes";
import { ClienteContratacionesTable } from "./_components/cliente-contrataciones-table";
import { ClienteDetailHeader } from "./_components/cliente-detail-header";
import { ClienteInfoCard } from "./_components/cliente-info-card";
import { ClienteResumenCard } from "./_components/cliente-resumen-card";
import { ClienteSiniestrosTable } from "./_components/cliente-siniestros-table";
import { ClienteTabsHeader } from "./_components/cliente-tabs-header";
import { ClienteFormModal } from "../_components/cliente-form-modal";

type SearchParams = Promise<{ tab?: string; modal?: string }>;

const TAB_VALUES = ["contrataciones", "siniestros", "actividad"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function parseTab(raw: string | undefined): TabValue {
  return (TAB_VALUES as readonly string[]).includes(raw ?? "")
    ? (raw as TabValue)
    : "contrataciones";
}

export default async function ClienteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [cliente, contrataciones, siniestros, sp] = await Promise.all([
    getClienteById(id),
    getClienteContrataciones(id),
    getClienteSiniestros(id),
    searchParams,
  ]);
  if (!cliente) notFound();

  const tab = parseTab(sp.tab);
  const showEdit = sp.modal === "edit";

  return (
    <>
      <ClienteDetailHeader cliente={cliente} />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
        <div className="flex flex-col gap-5">
          <ClienteInfoCard cliente={cliente} />
          <ClienteResumenCard cliente={cliente} />
        </div>

        <Card className="overflow-hidden p-0 gap-0">
          <ClienteTabsHeader
            clienteId={cliente.id}
            active={tab}
            tabs={[
              { value: "contrataciones", label: "Contrataciones", count: contrataciones.length },
              { value: "siniestros", label: "Siniestros", count: siniestros.length },
              { value: "actividad", label: "Actividad" },
            ]}
          />
          <div>
            {tab === "contrataciones" && (
              <ClienteContratacionesTable rows={contrataciones} />
            )}
            {tab === "siniestros" && (
              <ClienteSiniestrosTable rows={siniestros} />
            )}
            {tab === "actividad" && (
              <EmptyState
                icon={Clock}
                title="Historial de actividad"
                subtitle="Próximamente."
              />
            )}
          </div>
        </Card>
      </div>

      {showEdit && <ClienteFormModal mode="edit" cliente={cliente} />}
    </>
  );
}
