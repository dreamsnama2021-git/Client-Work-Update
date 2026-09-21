import { FileText } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export default function ClientFilesIndexPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        icon={FileText}
        title="Select a folder"
        description="Pick a folder from the list to see its files."
        className="border-0"
      />
    </div>
  );
}
