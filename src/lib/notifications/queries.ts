import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { Notification } from "@/types/notification";

export interface ListNotificationsResult {
  notifications: Notification[];
  error: string | null;
}

export async function listMyNotifications(
  limit = 10,
): Promise<ListNotificationsResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { notifications: [], error: null };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { notifications: [], error: error.message };
  }

  return { notifications: data ?? [], error: null };
}
