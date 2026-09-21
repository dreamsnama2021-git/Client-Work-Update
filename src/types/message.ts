import type { Database } from "./database.types";

export type Message = Database["public"]["Tables"]["messages"]["Row"];

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export interface Conversation {
  client: { id: string; company_name: string };
  lastMessage: {
    body: string;
    created_at: string;
  } | null;
}
