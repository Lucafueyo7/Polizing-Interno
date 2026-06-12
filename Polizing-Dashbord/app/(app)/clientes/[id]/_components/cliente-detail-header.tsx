import Link from "next/link";
import { ChevronLeft, Edit, Mail, Plus } from "@/components/icons";
import { ClienteAvatar } from "@/components/shared/cliente-avatar";
import { ClienteTipoBadge } from "@/components/shared/status-badges/cliente-tipo-badge";
import { EstadoClienteBadge } from "@/components/shared/status-badges/estado-cliente-badge";
import { buttonVariants } from "@/components/ui/button";
import type { ClienteFull } from "@/lib/data/types";

export function ClienteDetailHeader({ cliente }: { cliente: ClienteFull }) {
  return (
    <header className="mb-5">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground mb-3"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Clientes
      </Link>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <ClienteAvatar letters={cliente.avatarLetters} size="lg" />
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] leading-tight text-foreground truncate">
              {cliente.label}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <ClienteTipoBadge tipo={cliente.tipo} />
              <EstadoClienteBadge estado={cliente.estado} />
              <span className="font-mono text-[12.5px] text-muted-foreground">
                {cliente.ident}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cliente.email && (
            <a
              href={`mailto:${cliente.email}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </a>
          )}
          <Link
            href={`/clientes/${cliente.id}?modal=edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Edit className="w-3.5 h-3.5" />
            Editar
          </Link>
          <Link
            href={`/polizas?modal=create&newForCliente=${cliente.id}`}
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva póliza
          </Link>
        </div>
      </div>
    </header>
  );
}
