import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { Conversation, MessageWithSender } from "@/types/message";

const MESSAGE_WITH_SENDER_SELECT =
  "*, sender:profiles(id, full_name, email, avatar_url)";

export interface ListConversationsResult {
  conversations: Conversation[];
  error: string | null;
}

/**
 * One row per client the current user can see (RLS scopes this to all
 * clients for an admin, or just the linked client for a client user),
 * annotated with that client's most recent message if any. Conversations
 * with a message sort to the top, most recent first.
 */
export async function listConversations(
  filters: { clientId?: string } = {},
): Promise<ListConversationsResult> {
  const supabase = await createSupabaseServerClient();

  let clientsQuery = supabase
    .from("clients")
    .select("id, company_name")
    .order("company_name", { ascending: true });

  if (filters.clientId) {
    clientsQuery = clientsQuery.eq("id", filters.clientId);
  }

  const [{ data: clients, error: clientsError }, { data: messages, error: messagesError }] =
    await Promise.all([
      clientsQuery,
      supabase
        .from("messages")
        .select("client_id, body, created_at")
        .order("created_at", { ascending: false }),
    ]);

  if (clientsError) {
    return { conversations: [], error: clientsError.message };
  }

  if (messagesError) {
    return { conversations: [], error: messagesError.message };
  }

  const lastMessageByClient = new Map<string, { body: string; created_at: string }>();
  for (const message of messages ?? []) {
    if (!lastMessageByClient.has(message.client_id)) {
      lastMessageByClient.set(message.client_id, {
        body: message.body,
        created_at: message.created_at,
      });
    }
  }

  const conversations: Conversation[] = (clients ?? []).map((client) => ({
    client,
    lastMessage: lastMessageByClient.get(client.id) ?? null,
  }));

  conversations.sort((a, b) => {
    if (a.lastMessage && b.lastMessage) {
      return (
        new Date(b.lastMessage.created_at).getTime() -
        new Date(a.lastMessage.created_at).getTime()
      );
    }
    if (a.lastMessage) return -1;
    if (b.lastMessage) return 1;
    return 0;
  });

  return { conversations, error: null };
}

export interface ListMessagesResult {
  messages: MessageWithSender[];
  error: string | null;
}

export async function listMessagesForClient(
  clientId: string,
): Promise<ListMessagesResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_WITH_SENDER_SELECT)
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  if (error) {
    return { messages: [], error: error.message };
  }

  return { messages: (data ?? []) as unknown as MessageWithSender[], error: null };
}
