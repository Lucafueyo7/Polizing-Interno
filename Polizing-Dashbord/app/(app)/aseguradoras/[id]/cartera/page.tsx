import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { getProviderForAseguradora } from "@/lib/insurers/registry";
import { InsurerError } from "@/lib/insurers/errors";
import type { Cartera } from "@/lib/insurers/types";

const PAGE_SIZE = 20;

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n - 1 : 0;
}

export default async function CarteraPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cp?: string; pp?: string }>;
}) {
  const { id: idRaw } = await params;
  const { cp, pp } = await searchParams;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const aseguradora = await prisma.empresas_aseguradoras.findUnique({
    where: { id },
    select: { razon_social: true, codigo_integracion: true },
  });
  if (!aseguradora) notFound();

  let cartera: Cartera | null = null;
  let error: string | null = null;

  if (!aseguradora.codigo_integracion) {
    error = "Esta aseguradora no tiene integración configurada.";
  } else {
    try {
      const provider = await getProviderForAseguradora(id);
      if (!provider.supports("cartera")) {
        error = `${provider.displayName} no expone consulta de cartera.`;
      } else {
        cartera = await provider.getCartera({});
      }
    } catch (err) {
      error =
        err instanceof InsurerError
          ? err.message
          : "No se pudo obtener la cartera.";
    }
  }

  return (
    <>
      <header className="mb-5">
        <Link
          href="/aseguradoras"
          className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Aseguradoras
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] leading-tight text-foreground">
            Cartera · {aseguradora.razon_social}
          </h1>
          {cartera && (
            <Badge variant={cartera.source === "live" ? "default" : "secondary"}>
              {cartera.source === "live" ? "En vivo" : "Sincronizada"}
            </Badge>
          )}
        </div>
      </header>

      {error ? (
        <Card className="px-5 py-8 text-center text-[13.5px] text-muted-foreground">
          {error}
        </Card>
      ) : cartera ? (
        <div className="flex flex-col gap-6">
          {cartera.clientes.length > 0 && (() => {
            const page = parsePage(cp);
            const totalPages = Math.ceil(cartera.clientes.length / PAGE_SIZE);
            const rows = cartera.clientes.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
            const href = (p: number) => `?cp=${p + 1}${pp ? `&pp=${pp}` : ""}`;
            return (
            <Card className="overflow-hidden p-0 gap-0">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">
                  Clientes ({cartera.clientes.length})
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>CUIT</TableHead>
                    <TableHead>Contacto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c, i) => (
                    <TableRow key={`${c.documento ?? c.cuit ?? "c"}-${page}-${i}`}>
                      <TableCell>{c.nombre ?? "—"}</TableCell>
                      <TableCell className="font-mono">{c.documento ?? "—"}</TableCell>
                      <TableCell className="font-mono">{c.cuit ?? "—"}</TableCell>
                      <TableCell>{c.email ?? c.telefono ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pager
                shown={rows.length}
                total={cartera.clientes.length}
                page={page}
                totalPages={totalPages}
                prevHref={page > 0 ? href(page - 1) : null}
                nextHref={page < totalPages - 1 ? href(page + 1) : null}
              />
            </Card>
            );
          })()}

          {cartera.polizas.length > 0 && (() => {
            const page = parsePage(pp);
            const totalPages = Math.ceil(cartera.polizas.length / PAGE_SIZE);
            const rows = cartera.polizas.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
            const href = (p: number) => `?pp=${p + 1}${cp ? `&cp=${cp}` : ""}`;
            return (
            <Card className="overflow-hidden p-0 gap-0">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">
                  Pólizas ({cartera.polizas.length})
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Póliza</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vigencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p, i) => (
                    <TableRow key={`${p.numeroPoliza}-${page}-${i}`}>
                      <TableCell className="font-mono">{p.numeroPoliza}</TableCell>
                      <TableCell>{p.estado ?? "—"}</TableCell>
                      <TableCell className="font-mono text-[12px]">
                        {formatVigencia(p.vigenciaInicio, p.vigenciaFin)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pager
                shown={rows.length}
                total={cartera.polizas.length}
                page={page}
                totalPages={totalPages}
                prevHref={page > 0 ? href(page - 1) : null}
                nextHref={page < totalPages - 1 ? href(page + 1) : null}
              />
            </Card>
            );
          })()}

          {cartera.clientes.length === 0 && cartera.polizas.length === 0 && (
            <Card className="px-5 py-8 text-center text-[13.5px] text-muted-foreground">
              La cartera está vacía.
            </Card>
          )}
        </div>
      ) : null}
    </>
  );
}

function formatVigencia(inicio?: string, fin?: string): string {
  const fmt = (s?: string) => (s ? s.slice(0, 10) : "—");
  if (!inicio && !fin) return "—";
  return `${fmt(inicio)} → ${fmt(fin)}`;
}

function Pager({
  shown,
  total,
  page,
  totalPages,
  prevHref,
  nextHref,
}: {
  shown: number;
  total: number;
  page: number;
  totalPages: number;
  prevHref: string | null;
  nextHref: string | null;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-brand-surface-2 text-[12.5px] text-muted-foreground">
      <span>
        Mostrando <b className="text-foreground">{shown}</b> de {total}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {prevHref ? (
            <Link href={prevHref} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className={buttonVariants({ variant: "ghost", size: "sm" }) + " opacity-40 pointer-events-none"}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </span>
          )}
          <span className="font-mono px-1">{page + 1} / {totalPages}</span>
          {nextHref ? (
            <Link href={nextHref} className={buttonVariants({ variant: "ghost", size: "sm" })}>
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
  );
}
