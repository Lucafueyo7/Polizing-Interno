import { Mail, Phone } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { fmtAR } from "@/lib/format/currency";
import { fmtNum } from "@/lib/format/number";
import { formatTelefono } from "@/lib/format/telefono";
import type { AseguradoraListItem } from "@/lib/data/types";
import { AseguradoraActions } from "./aseguradora-actions";

export function AseguradoraCard({ a }: { a: AseguradoraListItem }) {
  return (
    <Card className="overflow-hidden p-0 gap-0">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div
          aria-hidden="true"
          className="w-11 h-11 rounded-lg grid place-items-center font-bold text-[14px] tracking-tight border shrink-0"
          style={{
            background: `${a.color}15`,
            color: a.color,
            borderColor: `${a.color}30`,
          }}
        >
          {a.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold leading-tight truncate">
            {a.razonSocial}
          </div>
          <div className="font-mono text-[12px] text-muted-foreground mt-0.5">
            {a.cuit}
          </div>
        </div>
        <AseguradoraActions id={a.id} />
      </div>

      <div className="px-5 py-4 flex flex-col gap-2.5">
        <ContactRow icon={Mail}>{a.email ?? "—"}</ContactRow>
        <ContactRow icon={Phone} mono>
          {formatTelefono(a.telefono)}
        </ContactRow>

        <div className="border-t border-border my-1.5" />

        <div className="grid grid-cols-2 gap-2">
          <Stat label="Pólizas activas" value={fmtNum(a.polizasActivas)} />
          <Stat label="Prima mensual" value={fmtAR(a.primaMensual)} small />
        </div>

        <div
          className="h-1.5 w-full rounded-full bg-secondary overflow-hidden mt-2"
          role="progressbar"
          aria-valuenow={Math.round(a.pctCartera)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${a.pctCartera.toFixed(0)}% de la cartera`}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${a.pctCartera}%`, background: a.color }}
          />
        </div>
        <div className="text-[11px] text-muted-foreground">
          {a.pctCartera.toFixed(0)}% de la cartera
        </div>
      </div>
    </Card>
  );
}

function ContactRow({
  icon: Icon,
  mono = false,
  children,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-[12.5px] text-brand-fg-2 min-w-0">
      <Icon
        className="w-3.5 h-3.5 text-muted-foreground shrink-0"
        aria-hidden="true"
      />
      <span className={mono ? "font-mono truncate" : "truncate"}>
        {children}
      </span>
    </div>
  );
}

function Stat({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
        {label}
      </div>
      <div
        className={`font-mono font-semibold mt-0.5 ${small ? "text-[14px]" : "text-[18px]"} text-foreground`}
      >
        {value}
      </div>
    </div>
  );
}
