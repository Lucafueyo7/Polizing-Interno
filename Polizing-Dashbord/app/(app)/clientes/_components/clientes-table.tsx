import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Sort } from "@/components/icons";
import { ClienteAvatar } from "@/components/shared/cliente-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { ClienteTipoBadge } from "@/components/shared/status-badges/cliente-tipo-badge";
import { EstadoClienteBadge } from "@/components/shared/status-badges/estado-cliente-badge";
import { buttonVariants } from "@/components/ui/button";
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
import { formatTelefono } from "@/lib/format/telefono";
import type { ClienteListItem } from "@/lib/data/types";

type SortField = "label" | "ident" | "prima" | "polizas";

export function ClientesTable({
  rows,
  total,
  page,
  totalPages,
  prevHref,
  nextHref,
  sortBy,
  sortDir,
  buildSortHref,
}: {
  rows: ClienteListItem[];
  total: number;
  page: number;
  totalPages: number;
  prevHref: string | null;
  nextHref: string | null;
  sortBy?: SortField;
  sortDir?: "asc" | "desc";
  buildSortHref: (sortBy: SortField, sortDir: "asc" | "desc") => string;
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

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortHeader
                label="Cliente"
                sortField="label"
                sortBy={sortBy}
                sortDir={sortDir}
                buildSortHref={buildSortHref}
              />
            </TableHead>
            <TableHead>
              <SortHeader
                label="Identificación"
                sortField="ident"
                sortBy={sortBy}
                sortDir={sortDir}
                buildSortHref={buildSortHref}
              />
            </TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead className="text-right">
              <SortHeader
                label="Pólizas"
                sortField="polizas"
                sortBy={sortBy}
                sortDir={sortDir}
                alignRight
                buildSortHref={buildSortHref}
              />
            </TableHead>
            <TableHead className="text-right">
              <SortHeader
                label="Prima mensual"
                sortField="prima"
                sortBy={sortBy}
                sortDir={sortDir}
                alignRight
                buildSortHref={buildSortHref}
              />
            </TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow
              key={c.id}
              className="cursor-pointer"
              data-href={`/clientes/${c.id}`}
            >
              <TableCell>
                <Link
                  href={`/clientes/${c.id}`}
                  className="flex items-center gap-3 hover:underline-offset-2"
                >
                  <ClienteAvatar letters={c.avatarLetters} />
                  <span className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground truncate">
                      {c.label}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">
                      {c.tipo === "corp"
                        ? "Persona jurídica"
                        : `Cliente desde ${fmtDate(c.desde).slice(3)}`}
                    </span>
                  </span>
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[12.5px]">{c.ident}</span>
                  <ClienteTipoBadge tipo={c.tipo} />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12.5px] text-foreground truncate max-w-[220px]">
                    {c.email ?? "—"}
                  </span>
                  <span className="text-[11.5px] font-mono text-muted-foreground">
                    {formatTelefono(c.telefono)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono font-medium">
                {c.polizasActivas}
              </TableCell>
              <TableCell className="text-right font-mono">
                {c.primaMensual ? fmtAR(c.primaMensual) : "—"}
              </TableCell>
              <TableCell>
                <EstadoClienteBadge estado={c.estado} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-brand-surface-2 text-[12.5px] text-muted-foreground">
        <span>
          Mostrando <b className="text-foreground">{rows.length}</b> de {total}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {prevHref ? (
              <Link
                href={prevHref}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className={buttonVariants({ variant: "ghost", size: "sm" }) + " opacity-40 pointer-events-none"}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </span>
            )}
            <span className="font-mono px-1">{page + 1} / {totalPages}</span>
            {nextHref ? (
              <Link
                href={nextHref}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className={buttonVariants({ variant: "ghost", size: "sm" }) + " opacity-40 pointer-events-none"}>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function SortHeader({
  label,
  sortField,
  sortBy,
  sortDir,
  buildSortHref,
  alignRight = false,
}: {
  label: string;
  sortField: SortField;
  sortBy?: SortField;
  sortDir?: "asc" | "desc";
  buildSortHref: (sortBy: SortField, sortDir: "asc" | "desc") => string;
  alignRight?: boolean;
}) {
  const active = sortBy === sortField;
  const nextDir = active && sortDir === "asc" ? "desc" : "asc";

  return (
    <Link
      href={buildSortHref(sortField, nextDir)}
      aria-label={`Ordenar por ${label} ${nextDir === "asc" ? "ascendente" : "descendente"}`}
      className={
        alignRight
          ? "inline-flex items-center justify-end gap-1.5 w-full"
          : "inline-flex items-center gap-1.5"
      }
    >
      <span>{label}</span>
      <Sort className={sortBy === sortField ? "w-3.5 h-3.5 text-foreground" : "w-3.5 h-3.5 text-muted-foreground"} />
    </Link>
  );
}
