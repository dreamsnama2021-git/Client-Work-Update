import { Skeleton } from "@/components/ui/skeleton";

export default function ClientFilesDetailLoading() {
  return (
    <>
      <div className="border-b border-border px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex-1 space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
      <div className="border-t border-border p-3">
        <Skeleton className="h-9 w-full" />
      </div>
    </>
  );
}
