import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export default function ClientesLoading() {
  return (
    <Card className="overflow-hidden p-0 gap-0 mt-5">
      <TableSkeleton rows={10} cols={6} />
    </Card>
  );
}
