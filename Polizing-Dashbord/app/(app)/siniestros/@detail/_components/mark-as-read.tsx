"use client";

import { useEffect } from "react";
import { marcarLeido } from "../../_actions/marcar-leido";

/**
 * Componente sin UI: al montar dispara la mutación que registra la lectura
 * del siniestro por el usuario actual. Si ya leyó este siniestro el server
 * action solo actualiza el `leido_en`.
 */
export function MarkAsRead({ id, leidoPorMi }: { id: number; leidoPorMi: boolean }) {
  useEffect(() => {
    if (leidoPorMi) return;
    void marcarLeido(id);
  }, [id, leidoPorMi]);
  return null;
}
