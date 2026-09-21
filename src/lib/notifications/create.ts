import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/** Best-effort notification writes — same rationale as logActivity(). */

export async function notifyUser(
  supabase: SupabaseClient<Database>,
  params: {
    recipientId: string;
    title: string;
    description: string;
    link?: string;
  },
) {
  try {
    await supabase.from("notifications").insert({
      recipient_id: params.recipientId,
      title: params.title,
      description: params.description,
      link: params.link ?? null,
    });
  } catch {
    // best-effort only
  }
}

export async function notifyAdmins(
  supabase: SupabaseClient<Database>,
  params: {
    title: string;
    description: string;
    link?: string;
  },
) {
  try {
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (!admins?.length) return;

    await supabase.from("notifications").insert(
      admins.map((admin) => ({
        recipient_id: admin.id,
        title: params.title,
        description: params.description,
        link: params.link ?? null,
      })),
    );
  } catch {
    // best-effort only
  }
}
