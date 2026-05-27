import Link from "next/link";
import { Search } from "@/components/icons";
import { ClienteAvatar } from "@/components/shared/cliente-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { PolizaBadge } from "@/components/shared/status-badges/poliza-badge";
import { VencimientoHint } from "@/components/shared/vencimiento-hint";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtAR } from "@/lib/format/currency";
import { fmtDate } from "@/lib/format/date";
import type { PolizaListItem } from "@/lib/data/types";

export function PolizasTable({
  rows,
  total,
}: {
  rows: PolizaListItem[];
  total: number;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="Sin resultados"
        subtitle="Probá ajustar los filtros."
      />
    );
  }

  const primaTotal = rows.reduce((s, p) => s + p.prima, 0);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° Póliza</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Aseguradora</TableHead>
            <TableHead>Tipo / Cobertura</TableHead>
            <TableHead>Vigencia</TableHead>
            <TableHead className="text-right">Suma asegurada</TableHead>
            <TableHead className="text-right">Prima</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-mono font-medium">
                <Link href={`/polizas/${p.id}`} className="hover:underline">
                  {p.numero}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/clientes/${p.cliente.id}`}
                  className="flex items-center gap-2.5 hover:underline-offset-2"
                >
                  <ClienteAvatar letters={p.cliente.avatarLetters} size="sm" />
                  <span className="flex flex-col min-w-0">
                    <span className="font-medium truncate">
                      {p.cliente.label}
                    </span>
                    <span className="font-mono text-[11.5px] text-muted-foreground">
                      {p.cliente.ident}
                    </span>
                  </span>
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-sm shrink-0"
                    style={{ background: p.aseguradora.color }}
                  />
                  <span className="truncate">{p.aseguradora.razonSocial}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{p.tipo}</span>
                  <small className="text-muted-foreground">{p.cobertura.nombre}</small>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[12.5px]">
                    {fmtDate(p.inicio)} → {fmtDate(p.fin)}
                  </span>
                  <VencimientoHint
                    dias={p.diasHastaVencimiento}
                    estado={p.estado}
                  />
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {p.suma ? fmtAR(p.suma) : "—"}
              </TableCell>
              <TableCell className="text-right font-mono font-medium">
                {fmtAR(p.prima)}
              </TableCell>
              <TableCell>
                <PolizaBadge estado={p.estado} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-brand-surface-2 text-[12.5px] text-muted-foreground">
        <span>
          Mostrando <b className="text-foreground">{rows.length}</b> de {total}
        </span>
        <span>
          Prima total:{" "}
          <b className="font-mono text-foreground">{fmtAR(primaTotal)}</b>
        </span>
      </div>
    </>
  );
}
