import { Card } from "@/components/ui/card";
import type { DistribucionAseguradora } from "@/lib/data/types";

export function DistribucionAseguradoras({
  items,
}: {
  items: DistribucionAseguradora[];
}) {
  return (
    <Card className="p-5 gap-4">
      <div>
        <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">
          Distribución por aseguradora
        </h3>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">
          Pólizas activas por compañía
        </p>
      </div>

      <ul className="flex flex-col gap-3.5">
        {items.map((a) => (
          <li key={a.id}>
            <div className="flex justify-between items-baseline text-[12.5px] mb-1.5">
              <span className="font-medium text-foreground">{a.razonSocial}</span>
              <span className="font-mono text-muted-foreground">
                {a.polizasActivas}{" "}
                <span className="opacity-60">· {a.pct.toFixed(0)}%</span>
              </span>
            </div>
            <div
              className="h-1.5 w-full rounded-full bg-secondary overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(a.pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${a.razonSocial}: ${a.pct.toFixed(0)} por ciento`}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${a.pct}%`, background: a.color }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
