import type { NoticiaListItem } from "@/lib/data/noticias";
import { NoticiaCard } from "./noticia-card";

export function NoticiasGrid({ items }: { items: NoticiaListItem[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
      {items.map((n) => (
        <NoticiaCard key={n.id} n={n} />
      ))}
    </div>
  );
}
