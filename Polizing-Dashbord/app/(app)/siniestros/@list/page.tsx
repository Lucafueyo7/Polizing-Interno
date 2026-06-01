import { InboxList } from "./_components/inbox-list";

type SearchParams = Promise<{ tab?: string; q?: string }>;

export default async function ListSlotPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  return <InboxList searchParams={sp} />;
}
