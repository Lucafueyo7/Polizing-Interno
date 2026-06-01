import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";
import { ClienteAvatar } from "@/components/shared/cliente-avatar";
import { Card } from "@/components/ui/card";
import type { PolizaFull } from "@/lib/data/types";

export function PolizaVinculacionCard({ poliza }: { poliza: PolizaFull }) {
  return (
    <Card className="overflow-hidden p-0 gap-0">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">
          Vinculación
        </h3>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">
        <Link
          href={`/clientes/${poliza.cliente.id}`}
          className="flex items-center gap-3 hover:bg-brand-surface-hover -mx-2 px-2 py-1.5 rounded-md transition-colors"
        >
          <ClienteAvatar letters={poliza.cliente.avatarLetters} />
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
              Cliente
            </div>
            <div className="text-[14px] font-medium text-foreground truncate">
              {poliza.cliente.label}
            </div>
            <div className="text-[12px] font-mono text-muted-foreground">
              {poliza.cliente.ident}
            </div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </Link>

        <div className="flex items-center gap-3 -mx-2 px-2 py-1.5">
          <span
            aria-hidden="true"
            className="w-9 h-9 rounded-lg grid place-items-center font-bold text-[12px] tracking-tight border shrink-0"
            style={{
              background: `${poliza.aseguradora.color}15`,
              color: poliza.aseguradora.color,
              borderColor: `${poliza.aseguradora.color}30`,
            }}
          >
            {poliza.aseguradora.razonSocial
              .split(/\s+/)
              .filter((w) => w.length > 2)
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
              Aseguradora
            </div>
            <div className="text-[14px] font-medium text-foreground truncate">
              {poliza.aseguradora.razonSocial}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
