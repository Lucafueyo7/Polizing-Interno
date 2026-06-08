function SkeletonBar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-muted ${className}`} />;
}

export type ListSkeletonProps = {
  items?: number;
};

/**
 * Esqueleto reutilizable para paneles de lista (siniestros, pagos – lado izquierdo).
 * Renderiza items placeholder con avatar, título y subtítulo.
 */
export function ListSkeleton({ items = 8 }: ListSkeletonProps) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          {/* Avatar */}
          <SkeletonBar className="h-8 w-8 rounded-full shrink-0" />
          {/* Text */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <SkeletonBar className="h-3.5 w-3/5" />
            <SkeletonBar className="h-3 w-2/5" />
          </div>
          {/* Date */}
          <SkeletonBar className="h-3 w-14 shrink-0" />
        </div>
      ))}
    </div>
  );
}
