import { AlertTriangle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ConversationList } from "@/components/messages/conversation-list";
import { TwoPaneShell } from "@/components/shared/two-pane-shell";
import { listConversations } from "@/lib/messages/queries";

export default async function ClientMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { conversations, error } = await listConversations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Talk with your agency team.
        </p>
      </div>

      <Card className="flex h-[70vh] min-h-[420px] overflow-hidden p-0">
        <TwoPaneShell
          basePath="/client/messages"
          listPane={
            error ? (
              <div className="p-4">
                <EmptyState
                  icon={AlertTriangle}
                  title="Couldn't load conversations"
                  description={error}
                />
              </div>
            ) : (
              <ConversationList conversations={conversations} basePath="/client/messages" />
            )
          }
        >
          {children}
        </TwoPaneShell>
      </Card>
    </div>
  );
}
