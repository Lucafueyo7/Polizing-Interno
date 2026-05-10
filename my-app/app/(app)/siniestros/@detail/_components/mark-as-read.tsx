"use client";

import { useEffect } from "react";
import { marcarLeido } from "../../_actions/marcar-leido";

/**
 * Componente sin UI: al montar dispara la mutación que marca el siniestro
 * como leído. Si ya estaba leído el server action es no-op.
 */
export function MarkAsRead({ id, leido }: { id: number; leido: boolean }) {
  useEffect(() => {
    if (leido) return;
    void marcarLeido(id);
  }, [id, leido]);
  return null;
}
