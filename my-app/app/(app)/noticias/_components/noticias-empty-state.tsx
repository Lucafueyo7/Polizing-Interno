import { Newspaper } from "@/components/icons";

export function NoticiasEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <Newspaper
        className="mx-auto w-8 h-8 text-muted-foreground"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-medium text-foreground">
        No hay noticias disponibles
      </p>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        No pudimos traer noticias desde Asegurando Digital en este momento.
        Probá actualizar en unos minutos.
      </p>
    </div>
  );
}
