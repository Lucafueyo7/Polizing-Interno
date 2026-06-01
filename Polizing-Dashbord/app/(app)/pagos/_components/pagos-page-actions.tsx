import { Download } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function PagosPageActions() {
  return (
    <Button variant="outline" size="sm" disabled>
      <Download className="w-3.5 h-3.5" />
      Exportar conciliación
    </Button>
  );
}
