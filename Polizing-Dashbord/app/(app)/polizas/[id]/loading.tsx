export default function Loading() {
  return (
    <div className="flex items-center justify-center h-96 text-muted-foreground">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent" />
    </div>
  );
}
