import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import type { ActivityType } from "@/types/activity";

/**
 * Best-effort activity log write — failures are swallowed so a logging
 * hiccup never blocks the action that triggered it (e.g. sending a
 * message should never fail because the activity feed insert failed).
 */
export async function logActivity(
  supabase: SupabaseClient<Database>,
  params: {
    type: ActivityType;
    actorId: string | null;
    message: string;
    target: string;
  },
) {
  try {
    await supabase.from("activity_events").insert({
      type: params.type,
      actor_id: params.actorId,
      message: params.message,
      target: params.target,
    });
  } catch {
    // best-effort only
  }
}
