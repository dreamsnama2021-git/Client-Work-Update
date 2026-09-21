import { MessageSquare } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export default function MessagesIndexPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        icon={MessageSquare}
        title="Select a conversation"
        description="Pick a client from the list to see its messages."
        className="border-0"
      />
    </div>
  );
}
