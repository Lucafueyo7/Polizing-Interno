import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { getPagoCounts, getPagosSummary } from "@/lib/data/pagos";
import { PagosPageActions } from "./_components/pagos-page-actions";
import { PagosSegmented } from "./_components/pagos-segmented";
import { PagosSummary } from "./_components/pagos-summary";

export default async function PagosLayout({
  children,
  list,
  detail,
}: {
  children: React.ReactNode;
  list: React.ReactNode;
  detail: React.ReactNode;
}) {
  const [summary, counts] = await Promise.all([
    getPagosSummary(),
    getPagoCounts(),
  ]);

  return (
    <>
      <PageHeader
        title="Pagos masivos"
        subtitle="Validación de comprobantes de pago — exclusivo clientes corporativos"
        actions={<PagosPageActions />}
      />

      <PagosSummary summary={summary} />

      <Card className="overflow-hidden p-0 gap-0 mt-5">
        <div className="px-4 py-3 border-b border-border">
          <PagosSegmented counts={counts} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] min-h-[600px]">
          <aside className="border-r border-border min-w-0 flex flex-col">
            {list}
          </aside>
          <section className="min-w-0">{detail}</section>
        </div>
      </Card>

      {children}
    </>
  );
}
