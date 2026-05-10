import { KvRow } from "@/components/shared/kv-row";
import { VencimientoHint } from "@/components/shared/vencimiento-hint";
import { Card } from "@/components/ui/card";
import { fmtDate } from "@/lib/format/date";
import type { PolizaFull } from "@/lib/data/types";

export function PolizaVigenciaCard({ poliza }: { poliza: PolizaFull }) {
  return (
    <Card className="overflow-hidden p-0 gap-0">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">
          Vigencia
        </h3>
      </div>
      <dl className="px-5 py-2">
        <KvRow label="Emisión" value={fmtDate(poliza.emision)} mono />
        <KvRow label="Inicio" value={fmtDate(poliza.inicio)} mono />
        <KvRow label="Fin" value={fmtDate(poliza.fin)} mono />
        <KvRow
          label="Estado"
          value={
            <span className="flex items-center gap-2">
              <span className="capitalize">{poliza.estado}</span>
              <VencimientoHint
                dias={poliza.diasHastaVencimiento}
                estado={poliza.estado}
              />
            </span>
          }
        />
      </dl>
    </Card>
  );
}
