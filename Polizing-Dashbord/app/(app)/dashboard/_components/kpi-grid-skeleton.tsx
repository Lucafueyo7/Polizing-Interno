import { Card } from "@/components/ui/card";

function SkeletonLine({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-muted ${className}`} />;
}

function SkeletonCard() {
  return (
    <Card className="p-4 gap-2.5">
      <div className="flex items-center gap-1.5">
        <div className="h-3.5 w-3.5 rounded-full bg-muted animate-pulse" />
        <SkeletonLine className="h-3 w-24" />
      </div>

      <SkeletonLine className="h-8 w-28" />

      <div className="flex items-center gap-1">
        <SkeletonLine className="h-3 w-20" />
      </div>

      <div className="mt-1 -mx-1">
        <SkeletonLine className="h-9 w-full rounded-md" />
      </div>
    </Card>
  );
}

export function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
