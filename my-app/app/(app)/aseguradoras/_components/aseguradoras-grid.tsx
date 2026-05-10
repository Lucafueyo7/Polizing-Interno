import type { AseguradoraListItem } from "@/lib/data/types";
import { AseguradoraCard } from "./aseguradora-card";

export function AseguradorasGrid({ items }: { items: AseguradoraListItem[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
      {items.map((a) => (
        <AseguradoraCard key={a.id} a={a} />
      ))}
    </div>
  );
}
