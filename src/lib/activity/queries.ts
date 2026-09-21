import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActivityEventWithActor } from "@/types/activity";

export interface ListActivityResult {
  activity: ActivityEventWithActor[];
  error: string | null;
}

export async function listRecentActivity(
  limit = 8,
): Promise<ListActivityResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("activity_events")
    .select("*, actor:profiles(id, full_name, email, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { activity: [], error: error.message };
  }

  return {
    activity: (data ?? []) as unknown as ActivityEventWithActor[],
    error: null,
  };
}
