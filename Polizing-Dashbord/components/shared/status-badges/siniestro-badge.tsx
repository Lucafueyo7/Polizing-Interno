import { Badge } from "@/components/ui/badge";
import {
  SINIESTRO_STATUS,
  type SiniestroEstado,
} from "@/lib/domain/poliza-status";
import { toneToBadgeVariant } from "./status-tone";

export function SiniestroBadge({ estado }: { estado: SiniestroEstado }) {
  const meta = SINIESTRO_STATUS[estado];
  return <Badge variant={toneToBadgeVariant(meta.tone)}>{meta.label}</Badge>;
}
