"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Search } from "@/components/icons";
import { Filterbar } from "@/components/shared/filterbar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormAseguradora, FormTipoSeguro } from "@/lib/data/types";

type Props = {
  initialQ: string;
  initialTipo: string;
  initialAseguradora: string;
  tipos: ReadonlyArray<FormTipoSeguro>;
  aseguradoras: ReadonlyArray<FormAseguradora>;
};

export function PolizasFilterbar({
  initialQ,
  initialTipo,
  initialAseguradora,
  tipos,
  aseguradoras,
}: Props) {
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
        router.push(qs ? `/polizas?${qs}` : "/polizas");
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
          placeholder="Buscar por N° de póliza, cliente, tipo..."
          aria-label="Buscar pólizas"
          className="pl-8"
        />
      </div>

      <Select
        value={initialTipo || "all"}
        onValueChange={(v) => updateParam({ tipo: v === "all" ? null : v })}
      >
        <SelectTrigger className="w-[200px]" aria-label="Filtrar por tipo">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          {tipos.map((t) => (
            <SelectItem key={t.id} value={t.nombre}>
              {t.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={initialAseguradora || "all"}
        onValueChange={(v) =>
          updateParam({ aseguradora: v === "all" ? null : v })
        }
      >
        <SelectTrigger
          className="w-[220px]"
          aria-label="Filtrar por aseguradora"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las aseguradoras</SelectItem>
          {aseguradoras.map((a) => (
            <SelectItem key={a.id} value={String(a.id)}>
              {a.razonSocial}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Filterbar>
  );
}
