import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { MessageComposer } from "@/components/messages/message-composer";
import { MessageThread } from "@/components/messages/message-thread";
import { sendMessage } from "@/lib/actions/messages";
import { listMessagesForClient } from "@/lib/messages/queries";
import { getClientById } from "@/lib/clients/queries";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminConversationPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ client, error: clientError }, { messages, error: messagesError }] =
    await Promise.all([
      getClientById(clientId),
      listMessagesForClient(clientId),
    ]);

  if (clientError) {
    return <EmptyState title="Couldn't load this conversation" description={clientError} />;
  }

  if (!client) {
    notFound();
  }

  const sendAction = sendMessage.bind(null, clientId);

  return (
    <>
      <div className="border-b border-border px-4 py-3">
        <p className="font-medium">{client.company_name}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messagesError ? (
          <EmptyState title="Couldn't load messages" description={messagesError} />
        ) : (
          <MessageThread messages={messages} currentUserId={user?.id ?? ""} />
        )}
      </div>

      <div className="border-t border-border p-3">
        <MessageComposer action={sendAction} />
      </div>
    </>
  );
}
