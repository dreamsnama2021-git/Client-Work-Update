"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity/log";
import { notifyAdmins, notifyUser } from "@/lib/notifications/create";

const approvalSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  clientId: z.string().trim().min(1, "Select a client"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ApprovalFormRawValues = {
  title: string;
  clientId: string;
  description: string;
};

export type ApprovalActionState = {
  error: string | null;
  fieldErrors?: Record<string, string>;
  values?: ApprovalFormRawValues;
};

function readRawValues(formData: FormData): ApprovalFormRawValues {
  return {
    title: String(formData.get("title") ?? ""),
    clientId: String(formData.get("clientId") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
}

export async function createApprovalRecord(
  _prevState: ApprovalActionState,
  formData: FormData,
): Promise<ApprovalActionState> {
  const values = readRawValues(formData);
  const parsed = approvalSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the highlighted fields.", fieldErrors, values };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { title, clientId, description } = parsed.data;

  const { data: insertResult, error } = await supabase
    .from("approvals")
    .insert({
      client_id: clientId,
      title,
      description: description || null,
      status: "pending",
      submitted_by: user?.id ?? null,
    })
    .select("id, client:clients(company_name, profile_id)")
    .single();

  if (error) {
    return { error: error.message, values };
  }

  const data = insertResult as unknown as {
    id: string;
    client: { company_name: string; profile_id: string | null } | null;
  };

  await logActivity(supabase, {
    type: "approval_requested",
    actorId: user?.id ?? null,
    message: "requested approval on",
    target: title,
  });

  const client = data.client;

  if (client?.profile_id) {
    await notifyUser(supabase, {
      recipientId: client.profile_id,
      title: "New approval request",
      description: `${client.company_name}: ${title}`,
      link: `/client/approvals/${data.id}`,
    });
  }

  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/approvals/${data.id}`);
}

/** Admin sends a revision-requested approval back into review, optionally
 * with an updated title/description reflecting the fix. */
export async function resubmitApproval(id: string, clientId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("approvals")
    .update({ status: "pending", feedback: null, reviewed_at: null })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/approvals");
  revalidatePath(`/admin/approvals/${id}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${clientId}`);
}

const responseSchema = z.object({
  action: z.enum(["approve", "request_revision"]),
  feedback: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type RespondActionState = {
  error: string | null;
};

/** Client approves or requests revisions on one of their own pending
 * approvals. RLS also enforces that the approval belongs to them and is
 * still pending; this re-checks so the UI can show a clean error. */
export async function respondToApproval(
  id: string,
  _prevState: RespondActionState,
  formData: FormData,
): Promise<RespondActionState> {
  const parsed = responseSchema.safeParse({
    action: formData.get("action"),
    feedback: formData.get("feedback") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Something went wrong. Please try again." };
  }

  if (parsed.data.action === "request_revision" && !parsed.data.feedback) {
    return { error: "Let them know what needs to change." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: updateResult, error } = await supabase
    .from("approvals")
    .update({
      status:
        parsed.data.action === "approve" ? "approved" : "revision_requested",
      feedback: parsed.data.action === "request_revision" ? parsed.data.feedback : null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("title, client_id, client:clients(company_name)")
    .single();

  if (error) {
    return { error: error.message };
  }

  const updated = updateResult as unknown as {
    title: string;
    client_id: string;
    client: { company_name: string } | null;
  };

  const clientName = updated.client?.company_name ?? "The client";

  if (parsed.data.action === "approve") {
    await logActivity(supabase, {
      type: "approval_approved",
      actorId: user?.id ?? null,
      message: "approved",
      target: updated.title,
    });
    await notifyAdmins(supabase, {
      title: "Approval approved",
      description: `${clientName} approved ${updated.title}.`,
      link: `/admin/approvals/${id}`,
    });
  } else {
    await logActivity(supabase, {
      type: "revision_requested",
      actorId: user?.id ?? null,
      message: "requested revisions on",
      target: updated.title,
    });
    await notifyAdmins(supabase, {
      title: "Revision requested",
      description: `${clientName} requested changes on ${updated.title}.`,
      link: `/admin/approvals/${id}`,
    });
  }

  revalidatePath("/client");
  revalidatePath("/client/approvals");
  revalidatePath(`/client/approvals/${id}`);
  redirect(`/client/approvals/${id}`);
}
