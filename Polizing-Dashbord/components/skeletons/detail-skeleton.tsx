function SkeletonBar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-muted ${className}`} />;
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-muted ${className}`} />
  );
}

/**
 * Esqueleto reutilizable para paneles de detalle (siniestros, pagos – lado derecho).
 * Renderiza header, metadata y contenido placeholder.
 */
export function DetailSkeleton() {
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonBar className="h-6 w-2/5" />
        <SkeletonBar className="h-4 w-1/3" />
      </div>

      {/* Tags row */}
      <div className="flex gap-2">
        <SkeletonBar className="h-6 w-20 rounded-md" />
        <SkeletonBar className="h-6 w-24 rounded-md" />
      </div>

      {/* Content blocks */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <SkeletonBar className="h-3.5 w-1/3" />
          <SkeletonBlock className="h-16 w-full" />
        </div>
        <div className="space-y-2">
          <SkeletonBar className="h-3.5 w-1/3" />
          <SkeletonBlock className="h-16 w-full" />
        </div>
      </div>

      <div className="space-y-2">
        <SkeletonBar className="h-3.5 w-1/4" />
        <SkeletonBlock className="h-24 w-full" />
      </div>
    </div>
  );
}
