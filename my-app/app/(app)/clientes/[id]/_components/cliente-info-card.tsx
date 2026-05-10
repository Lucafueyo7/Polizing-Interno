import { KvRow } from "@/components/shared/kv-row";
import { Card } from "@/components/ui/card";
import { fmtDate } from "@/lib/format/date";
import type { ClienteFull } from "@/lib/data/types";

export function ClienteInfoCard({ cliente }: { cliente: ClienteFull }) {
  const isCorp = cliente.tipo === "corp";
  const sectionLabel = isCorp ? "Datos empresariales" : "Datos personales";

  return (
    <Card className="overflow-hidden p-0 gap-0">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-[14.5px] font-semibold tracking-[-0.01em]">
          {sectionLabel}
        </h3>
      </div>
      <dl className="px-5 py-2">
        {isCorp ? (
          <>
            <KvRow label="Razón social" value={cliente.label} />
            <KvRow label="CUIT" value={cliente.ident} mono />
            <KvRow label="Contacto" value={cliente.contactoNombre} />
          </>
        ) : (
          <>
            <KvRow label="Nombre" value={cliente.label} />
            <KvRow label="DNI" value={cliente.ident} mono />
          </>
        )}
        <KvRow label="Email" value={cliente.email} />
        <KvRow label="Teléfono" value={cliente.telefono} mono />
        <KvRow label="Dirección" value={cliente.direccion} />
        <KvRow
          label="Cliente desde"
          value={cliente.desde ? fmtDate(cliente.desde) : "—"}
        />
      </dl>
    </Card>
  );
}
