import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { getSiniestroCounts } from "@/lib/data/siniestros";
import { fmtNum } from "@/lib/format/number";
import { InboxTabs } from "./_components/inbox-tabs";
import { SiniestrosPageActions } from "./_components/siniestros-page-actions";

export default async function SiniestrosLayout({
  children,
  list,
  detail,
}: {
  children: React.ReactNode;
  list: React.ReactNode;
  detail: React.ReactNode;
}) {
  const counts = await getSiniestroCounts();

  return (
    <>
      <PageHeader
        title="Siniestros"
        subtitle={`Bandeja de entrada · ${fmtNum(counts.nuevo)} nuevos sin revisar · ${fmtNum(counts.tramite)} en trámite`}
        actions={<SiniestrosPageActions />}
      />

      <InboxTabs counts={counts} />

      <Card className="overflow-hidden p-0 gap-0 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] min-h-[600px]">
          <aside className="border-r border-border min-w-0 flex flex-col">
            {list}
          </aside>
          <section className="min-w-0">{detail}</section>
        </div>
      </Card>

      {/* Children slot — vacío en navegación normal, monta el modal de
          "Nuevo siniestro" cuando ?modal=create. */}
      {children}
    </>
  );
}
