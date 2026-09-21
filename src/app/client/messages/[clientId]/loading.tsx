import { Skeleton } from "@/components/ui/skeleton";

export default function ClientConversationLoading() {
  return (
    <>
      <div className="border-b border-border px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex-1 space-y-3 p-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="ml-auto h-12 w-2/3" />
        <Skeleton className="h-12 w-1/2" />
      </div>
      <div className="border-t border-border p-3">
        <Skeleton className="h-16 w-full" />
      </div>
    </>
  );
}
