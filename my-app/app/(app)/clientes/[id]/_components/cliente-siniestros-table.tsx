import Link from "next/link";
import { AlertIcon } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { SiniestroBadge } from "@/components/shared/status-badges/siniestro-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtDate } from "@/lib/format/date";
import type { SiniestroListItem } from "@/lib/data/types";

export function ClienteSiniestrosTable({
  rows,
}: {
  rows: SiniestroListItem[];
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={AlertIcon}
        title="Sin siniestros"
        subtitle="Este cliente no tiene siniestros reportados."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N°</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-mono font-medium">
              <Link href={`/siniestros/${s.id}`} className="hover:underline">
                {s.numero}
              </Link>
            </TableCell>
            <TableCell className="font-mono text-muted-foreground text-[12.5px]">
              {fmtDate(s.fechaReporte.slice(0, 10))}
            </TableCell>
            <TableCell>{s.titulo}</TableCell>
            <TableCell>
              <SiniestroBadge estado={s.estado} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
