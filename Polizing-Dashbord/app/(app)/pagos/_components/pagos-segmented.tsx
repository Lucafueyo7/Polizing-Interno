"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Segmented } from "@/components/shared/segmented";
import type { PagoCounts, PagoTab } from "@/lib/data/types";

export function PagosSegmented({ counts }: { counts: PagoCounts }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const active: PagoTab =
    (searchParams.get("tab") as PagoTab | null) ?? "pendiente";

  const goToTab = (tab: PagoTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "pendiente") params.delete("tab");
    else params.set("tab", tab);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/pagos?${qs}` : "/pagos");
    });
  };

  return (
    <Segmented
      aria-label="Filtrar pagos"
      value={active}
      onChange={goToTab}
      options={[
        { value: "pendiente", label: `Pendientes · ${counts.pendiente}` },
        { value: "validado", label: `Validados · ${counts.validado}` },
        { value: "all", label: `Todos · ${counts.all}` },
      ]}
    />
  );
}
