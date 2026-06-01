"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Search } from "@/components/icons";
import { Filterbar } from "@/components/shared/filterbar";
import { Segmented } from "@/components/shared/segmented";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClienteEstado } from "@/lib/data/types";

const TIPO_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "normal", label: "Particulares" },
  { value: "corp", label: "Corporativos" },
] as const;

type TipoFilter = (typeof TIPO_OPTIONS)[number]["value"];
type EstadoFilter = ClienteEstado | "all";

type ClientesFilterbarProps = {
  initialQ: string;
  initialTipo: TipoFilter;
  initialEstado: EstadoFilter;
};

export function ClientesFilterbar({
  initialQ,
  initialTipo,
  initialEstado,
}: ClientesFilterbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const [, startTransition] = useTransition();

  const updateParam = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/clientes?${qs}` : "/clientes");
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      if (q !== initialQ) updateParam({ q: q || null });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialQ es estable durante este render
  }, [q]);

  const tipo: TipoFilter =
    initialTipo === "normal" || initialTipo === "corp" ? initialTipo : "all";
  const estado: EstadoFilter =
    initialEstado === "activo" || initialEstado === "baja" ? initialEstado : "all";

  return (
    <Filterbar>
      <div className="relative flex-1 max-w-[360px]">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, DNI, CUIT, email..."
          aria-label="Buscar clientes"
          className="pl-8"
        />
      </div>

      <Segmented
        aria-label="Filtrar por tipo de cliente"
        options={TIPO_OPTIONS}
        value={tipo}
        onChange={(v) => updateParam({ tipo: v === "all" ? null : v })}
      />

      <Select
        value={estado}
        onValueChange={(v) =>
          updateParam({ estado: v === "all" ? null : v })
        }
      >
        <SelectTrigger className="w-[170px]" aria-label="Filtrar por estado">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="activo">Activos</SelectItem>
          <SelectItem value="baja">De baja</SelectItem>
        </SelectContent>
      </Select>
    </Filterbar>
  );
}

export type { TipoFilter, EstadoFilter };
