"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search } from "@/components/icons";
import { Input } from "@/components/ui/input";

export function InboxSearch({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const handle = setTimeout(() => {
      if (q === initialQ) return;
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/siniestros?${qs}` : "/siniestros");
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialQ es estable durante este render
  }, [q]);

  return (
    <div className="relative">
      <Search
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar siniestros..."
        aria-label="Buscar siniestros"
        className="pl-7 h-8 text-[13px]"
      />
    </div>
  );
}
