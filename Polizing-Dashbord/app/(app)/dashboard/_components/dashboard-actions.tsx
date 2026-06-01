import Link from "next/link";
import { Download, Plus, Refresh } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";

export function DashboardActions() {
  return (
    <>
      <Button variant="outline" size="sm" disabled>
        <Refresh className="w-3.5 h-3.5" />
        Actualizar
      </Button>
      <Button variant="outline" size="sm" disabled>
        <Download className="w-3.5 h-3.5" />
        Exportar
      </Button>
      <Link href="/polizas?modal=create" className={buttonVariants({ size: "sm" })}>
        <Plus className="w-3.5 h-3.5" />
        Nueva póliza
      </Link>
    </>
  );
}
