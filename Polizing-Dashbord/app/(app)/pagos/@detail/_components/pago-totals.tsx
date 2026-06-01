import { fmtAR } from "@/lib/format/currency";
import type { PagoFull } from "@/lib/data/types";

export function PagoTotals({ pago }: { pago: PagoFull }) {
  return (
    <section>
      <h3 className="text-[13px] font-semibold mb-2.5">
        Detalle de pago · {pago.polizas.length} pólizas
      </h3>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_140px_140px] px-4 py-2.5 bg-brand-surface-2 border-b border-border text-[11px] font-semibold tracking-[0.04em] uppercase text-muted-foreground">
          <div>Concepto</div>
          <div>Tipo</div>
          <div className="text-right">N° Póliza</div>
          <div className="text-right">Monto</div>
        </div>

        {pago.polizas.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_140px_140px_140px] px-4 py-3 border-b border-border last:border-0 items-center"
          >
            <div>
              <div className="text-[13px] font-medium">{item.concepto}</div>
              <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground mt-0.5">
                <span
                  aria-hidden="true"
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ background: item.aseguradora.color }}
                />
                {item.aseguradora.razonSocial}
              </div>
            </div>
            <div className="text-[12.5px] text-muted-foreground">
              {item.tipo}
            </div>
            <div className="text-right font-mono text-[12.5px]">
              {item.numero}
            </div>
            <div className="text-right font-mono font-medium text-[13.5px]">
              {fmtAR(item.prima)}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-end gap-6 px-4 py-3 bg-brand-surface-2 text-[12.5px] text-muted-foreground">
          <span>
            Subtotal:{" "}
            <b className="font-mono text-foreground">{fmtAR(pago.monto)}</b>
          </span>
          <span>
            IVA: <b className="font-mono text-foreground">incluido</b>
          </span>
          <span className="text-[14px]">
            Total:{" "}
            <b className="font-mono font-semibold text-foreground">
              {fmtAR(pago.monto)}
            </b>
          </span>
        </div>
      </div>
    </section>
  );
}
