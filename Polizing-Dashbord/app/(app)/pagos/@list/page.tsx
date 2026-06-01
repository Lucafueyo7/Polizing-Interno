import { PagosList } from "./_components/pagos-list";

type SearchParams = Promise<{ tab?: string }>;

export default async function ListSlotPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  return <PagosList searchParams={sp} />;
}
