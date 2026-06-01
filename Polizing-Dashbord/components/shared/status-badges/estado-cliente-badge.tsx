import { Badge } from "@/components/ui/badge";
import type { ClienteEstado } from "@/lib/data/types";

export function EstadoClienteBadge({ estado }: { estado: ClienteEstado }) {
  return estado === "activo" ? (
    <Badge variant="success">Activo</Badge>
  ) : (
    <Badge variant="neutral">Baja</Badge>
  );
}
