import Link from "next/link";
import { Download, Plus } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";

export function PolizasPageActions() {
  return (
    <>
      <Button variant="outline" size="sm" disabled>
        <Download className="w-3.5 h-3.5" />
        Exportar
      </Button>
      <Link
        href="/polizas?modal=create"
        className={buttonVariants({ size: "sm" })}
      >
        <Plus className="w-3.5 h-3.5" />
        Nueva póliza
      </Link>
    </>
  );
}
