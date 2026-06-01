import { Badge } from "@/components/ui/badge";
import type { ClienteTipo } from "@/lib/data/types";

export function ClienteTipoBadge({ tipo }: { tipo: ClienteTipo }) {
  return tipo === "corp" ? (
    <Badge variant="info">Corporativo</Badge>
  ) : (
    <Badge variant="neutral">Particular</Badge>
  );
}
