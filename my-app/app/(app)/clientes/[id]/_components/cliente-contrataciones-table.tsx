import Link from "next/link";
import { Shield } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { PolizaBadge } from "@/components/shared/status-badges/poliza-badge";
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

export function ClienteContratacionesTable({
  rows,
}: {
  rows: PolizaListItem[];
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="Sin contrataciones"
        subtitle="Este cliente aún no tiene pólizas asociadas."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Póliza</TableHead>
          <TableHead>Tipo / Cobertura</TableHead>
          <TableHead>Aseguradora</TableHead>
          <TableHead>Vigencia</TableHead>
          <TableHead className="text-right">Suma asegurada</TableHead>
          <TableHead className="text-right">Prima mensual</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => (
          <TableRow key={p.id} className="cursor-pointer">
            <TableCell className="font-mono font-medium">
              <Link href={`/polizas/${p.id}`} className="hover:underline">
                {p.numero}
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{p.tipo}</span>
                <small className="text-muted-foreground">{p.cobertura}</small>
              </div>
            </TableCell>
            <TableCell>{p.aseguradora.razonSocial}</TableCell>
            <TableCell className="font-mono text-muted-foreground text-[12.5px]">
              {fmtDate(p.inicio)} → {fmtDate(p.fin)}
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
  );
}
