"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type UseUrlModalOptions = {
  /** Ruta a la que se navega cuando el usuario cierra el modal. */
  closeTo: string;
};

/**
 * Encapsula el patrón "modal abierto vía `?modal=...` que se cierra navegando
 * a otra URL". Devuelve el estado controlado para el `<Dialog>` y un `close()`
 * idempotente que dispara la animación de salida antes de navegar.
 */
export function useUrlModal({ closeTo }: UseUrlModalOptions) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    startTransition(() => {
      router.push(closeTo);
    });
  };

  const onOpenChange = (next: boolean) => {
    if (!next) close();
  };

  return { open, setOpen, close, onOpenChange };
}
