import Link from "next/link";
import { ChevronLeft, Edit } from "@/components/icons";
import { PolizaBadge } from "@/components/shared/status-badges/poliza-badge";
import { buttonVariants } from "@/components/ui/button";
import type { PolizaFull } from "@/lib/data/types";

export function PolizaDetailHeader({ poliza }: { poliza: PolizaFull }) {
  return (
    <header className="mb-5">
      <Link
        href="/polizas"
        className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground mb-3"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Pólizas
      </Link>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] leading-tight text-foreground font-mono">
            {poliza.numero}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <PolizaBadge estado={poliza.estado} />
            <span className="text-[13px] text-muted-foreground">
              {poliza.tipo} · {poliza.cobertura}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/polizas?modal=edit&id=${poliza.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Edit className="w-3.5 h-3.5" />
            Editar
          </Link>
        </div>
      </div>
    </header>
  );
}
