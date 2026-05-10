import { KvRow } from "@/components/shared/kv-row";
import { Card } from "@/components/ui/card";
import { fmtAR } from "@/lib/format/currency";
import type { PolizaFull } from "@/lib/data/types";

export function PolizaDatosCard({ poliza }: { poliza: PolizaFull }) {
  return (
    <Card className="overflow-hidden p-0 gap-0">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">
          Datos y montos
        </h3>
      </div>
      <dl className="px-5 py-2">
        <KvRow label="Tipo" value={poliza.tipo} />
        <KvRow label="Cobertura" value={poliza.cobertura} />
        <KvRow label="Suma asegurada" value={fmtAR(poliza.suma)} mono />
        <KvRow label="Prima mensual" value={fmtAR(poliza.prima)} mono />
        <KvRow
          label="Prima anualizada"
          value={fmtAR(poliza.prima * 12)}
          mono
        />
      </dl>
    </Card>
  );
}
