import Link from "next/link";
import { ArrowUpRight, Shield } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { fmtAR } from "@/lib/format/currency";
import type { SiniestroFull } from "@/lib/data/types";

export function PolizaVinculada({ poliza }: { poliza: SiniestroFull["poliza"] }) {
  return (
    <section>
      <h4 className="text-[12px] font-semibold tracking-[0.04em] uppercase text-muted-foreground mb-2">
        Póliza vinculada
      </h4>
      <div className="rounded-lg border border-border px-4 py-3 flex items-center gap-4 flex-wrap">
        <span
          className="w-9 h-9 rounded-md grid place-items-center bg-brand-primary-soft text-primary shrink-0"
          aria-hidden="true"
        >
          <Shield className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-[180px]">
          <div className="font-mono font-semibold text-[13.5px]">
            {poliza.numero}
          </div>
          <div className="text-[11.5px] text-muted-foreground">
            {poliza.tipo} · {poliza.cobertura}
          </div>
        </div>
        <Stat label="Aseguradora" value={poliza.aseguradora.razonSocial} />
        <Stat label="Suma asegurada" value={fmtAR(poliza.suma)} mono />
        <Link
          href={`/polizas/${poliza.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Ver póliza
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
        {label}
      </div>
      <div
        className={`text-[12.5px] mt-0.5 text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
