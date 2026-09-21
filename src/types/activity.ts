import type { ActivityType, Database } from "./database.types";

export type { ActivityType };
export type ActivityEvent = Database["public"]["Tables"]["activity_events"]["Row"];

export interface ActivityEventWithActor extends ActivityEvent {
  actor: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}
