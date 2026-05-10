import { Badge } from "@/components/ui/badge";
import { POLIZA_STATUS, type PolizaEstado } from "@/lib/domain/poliza-status";
import { toneToBadgeVariant } from "./status-tone";

export function PolizaBadge({ estado }: { estado: PolizaEstado }) {
  const meta = POLIZA_STATUS[estado];
  return <Badge variant={toneToBadgeVariant(meta.tone)}>{meta.label}</Badge>;
}
