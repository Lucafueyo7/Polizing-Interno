import Link from "next/link";
import { Plus } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";

export function AseguradorasPageActions() {
  return (
    <Link
      href="/aseguradoras?modal=create"
      className={buttonVariants({ size: "sm" })}
    >
      <Plus className="w-3.5 h-3.5" />
      Nueva aseguradora
    </Link>
  );
}
