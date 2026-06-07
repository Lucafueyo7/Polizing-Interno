import Link from "next/link";
import { UserPlus } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";

export function UsuariosPageActions() {
  return (
    <Link href="/usuarios?modal=create" className={buttonVariants({ size: "sm" })}>
      <UserPlus className="w-3.5 h-3.5" />
      Nuevo usuario
    </Link>
  );
}
