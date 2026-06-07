"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Refresh } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";

export function DashboardActions() {
  const router = useRouter();

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => router.refresh()}>
        <Refresh className="w-3.5 h-3.5" />
        Actualizar
      </Button>
      <Link href="/polizas?modal=create" className={buttonVariants({ size: "sm" })}>
        <Plus className="w-3.5 h-3.5" />
        Nueva póliza
      </Link>
    </>
  );
}
