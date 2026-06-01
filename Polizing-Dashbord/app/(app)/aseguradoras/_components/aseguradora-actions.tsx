"use client";

import { useRouter } from "next/navigation";
import { Briefcase, Edit, More } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AseguradoraActions({ id }: { id: number }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Más acciones"
        className="w-7 h-7 grid place-items-center rounded-md text-muted-foreground hover:bg-brand-surface-hover hover:text-foreground"
      >
        <More className="w-3.5 h-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            router.push(`/aseguradoras?modal=edit&id=${id}`)
          }
        >
          <Edit className="w-3.5 h-3.5" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/aseguradoras/${id}/cartera`)}>
          <Briefcase className="w-3.5 h-3.5" />
          Ver cartera
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
