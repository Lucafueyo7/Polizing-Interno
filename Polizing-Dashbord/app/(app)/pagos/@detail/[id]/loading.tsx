export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full min-h-60 text-muted-foreground">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-current border-t-transparent" />
    </div>
  );
}
