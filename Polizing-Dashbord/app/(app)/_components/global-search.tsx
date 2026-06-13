"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type ComponentType } from "react";
import { AlertIcon, Search, Shield, Users, Wallet } from "@/components/icons";
import { searchGlobal, type GlobalSearchResults, type SearchHit } from "@/lib/data/search";

type Section = {
  key: keyof GlobalSearchResults;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const SECTIONS: ReadonlyArray<Section> = [
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "polizas", label: "Pólizas", icon: Shield },
  { key: "siniestros", label: "Siniestros", icon: AlertIcon },
  { key: "pagos", label: "Pagos", icon: Wallet },
];

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce + búsqueda. Con q < 2 no buscamos; el dropdown igual se oculta
  // porque `showDropdown` exige longitud >= 2 (no hace falta limpiar acá).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      startTransition(async () => {
        const res = await searchGlobal(q);
        setResults(res);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Cerrar al clickear afuera.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const hasResults =
    results !== null &&
    SECTIONS.some((s) => results[s.key].length > 0);
  const showDropdown = open && query.trim().length >= 2;

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults(null);
  };

  return (
    <div ref={containerRef} className="ml-auto relative w-[320px] hidden md:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="Buscar clientes, pólizas, siniestros..."
        className="w-full h-9 border border-border bg-brand-surface-2 rounded-lg pl-9 pr-4 outline-none text-[13px] focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(15,39,68,.08)] transition-colors"
      />

      {showDropdown && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-20 max-h-[70dvh] overflow-y-auto rounded-lg border border-border bg-card shadow-lg py-1.5">
          {!hasResults ? (
            <p className="px-3 py-4 text-[12.5px] text-muted-foreground text-center">
              {results === null ? "Buscando…" : "Sin resultados."}
            </p>
          ) : (
            SECTIONS.map((section) => {
              const hits = results![section.key];
              if (hits.length === 0) return null;
              const Icon = section.icon;
              return (
                <div key={section.key} className="px-1.5 py-1">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[10.5px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
                    <Icon className="w-3 h-3" />
                    {section.label}
                  </div>
                  {hits.map((hit: SearchHit) => (
                    <Link
                      key={hit.id}
                      href={hit.href}
                      onClick={close}
                      className="block px-2 py-1.5 rounded-md hover:bg-brand-surface-hover"
                    >
                      <div className="text-[13px] font-medium truncate">{hit.title}</div>
                      <div className="text-[11.5px] text-muted-foreground truncate">
                        {hit.subtitle}
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
