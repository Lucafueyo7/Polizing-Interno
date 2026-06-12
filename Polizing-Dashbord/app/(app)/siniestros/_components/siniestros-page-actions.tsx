import Link from "next/link";
import { Plus } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";

export function SiniestrosPageActions() {
  return (
    <>
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
