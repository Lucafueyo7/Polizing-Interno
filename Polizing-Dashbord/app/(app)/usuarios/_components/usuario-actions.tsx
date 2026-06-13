"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Edit, More, Trash } from "@/components/icons";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toastError, toastSuccess } from "@/lib/ui/toast";
import { deleteUsuario } from "../_actions/delete-usuario";

export function UsuarioActions({ id }: { id: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => setShowDeleteConfirm(true);

  const handleConfirmDelete = () => {
    startTransition(async () => {
      const result = await deleteUsuario(id);
      if (result.ok) {
        toastSuccess("Usuario eliminado.");
        router.refresh();
      } else {
        toastError(result.error);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Más acciones"
          disabled={isPending}
          className="w-7 h-7 grid place-items-center rounded-md text-muted-foreground hover:bg-brand-surface-hover hover:text-foreground disabled:opacity-40"
        >
          <More className="w-3.5 h-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/usuarios?modal=edit&id=${id}`)}
          >
            <Edit className="w-3.5 h-3.5" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDeleteClick}
          >
            <Trash className="w-3.5 h-3.5" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Eliminar usuario"
        description="¿Eliminás este usuario? La acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
