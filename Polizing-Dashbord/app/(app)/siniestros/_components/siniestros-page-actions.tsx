import Link from "next/link";
import { Plus, Refresh } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";

export function SiniestrosPageActions() {
  return (
    <>
      <Button variant="outline" size="sm" disabled>
        <Refresh className="w-3.5 h-3.5" />
        Sincronizar WhatsApp
      </Button>
      <Link
        href="/siniestros?modal=create"
        className={buttonVariants({ size: "sm" })}
      >
        <Plus className="w-3.5 h-3.5" />
        Nuevo siniestro
      </Link>
    </>
  );
}
