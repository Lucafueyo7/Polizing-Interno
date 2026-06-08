function SkeletonBar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-muted ${className}`} />;
}

export type TableSkeletonProps = {
  rows?: number;
  cols?: number;
};

/**
 * Esqueleto reutilizable para páginas con tabla de datos (clientes, pólizas).
 * Renderiza filas y columnas placeholder con el mismo espaciado que la tabla real.
 */
export function TableSkeleton({ rows = 10, cols = 5 }: TableSkeletonProps) {
  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBar
            key={`h-${i}`}
            className={`h-4 ${i === 0 ? "w-1/4" : "flex-1"}`}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={`r-${r}`}
          className="flex items-center gap-4 px-4 py-3 border-b border-border"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBar
              key={`c-${r}-${c}`}
              className={`h-4 ${c === 0 ? "w-1/4" : "flex-1"}`}
            />
          ))}
        </div>
      ))}

      {/* Pagination placeholder */}
      <div className="flex items-center justify-between px-4 py-3">
        <SkeletonBar className="h-4 w-24" />
        <div className="flex gap-1">
          <SkeletonBar className="h-8 w-8 rounded-md" />
          <SkeletonBar className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}
