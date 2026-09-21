"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity/log";
import { notifyAdmins, notifyUser } from "@/lib/notifications/create";

const messageSchema = z.object({
  body: z.string().trim().min(1, "Write a message first").max(4000),
});

export type MessageActionState = {
  error: string | null;
  values?: { body: string };
};

export async function sendMessage(
  clientId: string,
  _prevState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const rawBody = String(formData.get("body") ?? "");
  const parsed = messageSchema.safeParse({ body: rawBody });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please write a message.",
      values: { body: rawBody },
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to send messages.", values: { body: rawBody } };
  }

  const { error } = await supabase.from("messages").insert({
    client_id: clientId,
    sender_id: user.id,
    body: parsed.data.body,
  });

  if (error) {
    return { error: error.message, values: { body: rawBody } };
  }

  const [{ data: senderProfile }, { data: clientResult }] = await Promise.all([
    supabase.from("profiles").select("role, full_name, email").eq("id", user.id).single(),
    supabase
      .from("clients")
      .select("company_name, profile_id")
      .eq("id", clientId)
      .single(),
  ]);

  const client = clientResult as unknown as {
    company_name: string;
    profile_id: string | null;
  } | null;

  await logActivity(supabase, {
    type: "message_sent",
    actorId: user.id,
    message: "sent a message to",
    target: client?.company_name ?? "a client",
  });

  const senderName = senderProfile?.full_name || senderProfile?.email || "Someone";
  const preview =
    parsed.data.body.length > 100
      ? `${parsed.data.body.slice(0, 100)}…`
      : parsed.data.body;

  if (senderProfile?.role === "admin") {
    if (client?.profile_id) {
      await notifyUser(supabase, {
        recipientId: client.profile_id,
        title: "New message",
        description: `${senderName}: ${preview}`,
        link: `/client/messages/${clientId}`,
      });
    }
  } else {
    await notifyAdmins(supabase, {
      title: "New message",
      description: `${senderName}: ${preview}`,
      link: `/admin/messages/${clientId}`,
    });
  }

  revalidatePath(`/admin/messages/${clientId}`);
  revalidatePath(`/client/messages/${clientId}`);
  revalidatePath("/admin/messages");
  revalidatePath("/client/messages");

  return { error: null };
}
