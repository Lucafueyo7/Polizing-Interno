import { Card } from "@/components/ui/card";
import { fmtAR } from "@/lib/format/currency";
import { fmtNum } from "@/lib/format/number";
import type { ClienteFull } from "@/lib/data/types";

type Stat = { label: string; value: string };

export function ClienteResumenCard({ cliente }: { cliente: ClienteFull }) {
  const stats: Stat[] = [
    { label: "Pólizas activas", value: fmtNum(cliente.polizasActivas) },
    { label: "Prima anualizada", value: fmtAR(cliente.primaAnualizada) },
    { label: "Siniestros (12m)", value: fmtNum(cliente.siniestrosCount) },
  ];

  return (
    <Card className="overflow-hidden p-0 gap-0">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">
          Resumen
        </h3>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3.5">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
              {s.label}
            </div>
            <div className="font-mono font-semibold mt-0.5 text-[20px] tracking-tight text-foreground">
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
