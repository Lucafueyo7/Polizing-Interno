import { getCurrentUser } from "@/lib/auth/session";
import { Inbox } from "@/components/icons";
import { EmptyState } from "@/components/shared/empty-state";
import { getSiniestros } from "@/lib/data/siniestros";
import type { SiniestroTab } from "@/lib/data/types";
import { InboxItem } from "./inbox-item";
import { InboxSearch } from "./inbox-search";

type SearchParams = { tab?: string; q?: string };

const TAB_VALUES: ReadonlyArray<SiniestroTab> = [
  "all",
  "nuevo",
  "pendiente_documentacion",
  "en_tramite",
  "cerrado",
  "rechazado",
];

function parseTab(raw: string | undefined): SiniestroTab {
  return (TAB_VALUES as ReadonlyArray<string>).includes(raw ?? "")
    ? (raw as SiniestroTab)
    : "all";
}

export async function InboxList({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const tab = parseTab(searchParams.tab);
  const q = searchParams.q?.trim() || undefined;
  const user = await getCurrentUser();
  const items = await getSiniestros({ tab, q }, user?.id);

  return (
    <>
      <div className="px-3 py-2.5 border-b border-border bg-brand-surface-2">
        <InboxSearch initialQ={q ?? ""} />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Sin siniestros"
            subtitle="No hay reportes que coincidan con el filtro."
          />
        ) : (
          items.map((item) => <InboxItem key={item.id} item={item} />)
        )}
      </div>
    </>
  );
}
