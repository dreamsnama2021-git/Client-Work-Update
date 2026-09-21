"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findClientProfileByEmail } from "@/lib/clients/queries";
import { logActivity } from "@/lib/activity/log";
import { SERVICE_TYPES } from "@/types/client";
import type { ServiceType, SlotContentType, WebsiteStatus } from "@/types/client";

const clientSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  contactName: z.string().trim().min(1, "Contact name is required").max(200),
  contactEmail: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ClientFormRawValues = {
  companyName: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  website: string;
  status: string;
  notes: string;
};

export type ClientServiceRawValue = {
  type: ServiceType;
  details: string;
  staticTarget: string;
  reelTarget: string;
  items: string[];
};

export type ClientActionState = {
  error: string | null;
  fieldErrors?: Record<string, string>;
  values?: ClientFormRawValues;
  services?: ClientServiceRawValue[];
};

function readRawValues(formData: FormData): ClientFormRawValues {
  return {
    companyName: String(formData.get("companyName") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    website: String(formData.get("website") ?? ""),
    status: String(formData.get("status") ?? "active"),
    notes: String(formData.get("notes") ?? ""),
  };
}

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    phone: formData.get("phone"),
    website: formData.get("website"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
}

function toFieldErrors(issues: z.ZodIssue[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0]);
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function toIntOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function readSelectedServices(formData: FormData): ClientServiceRawValue[] {
  return SERVICE_TYPES.filter(
    (type) => formData.get(`service_${type}`) === "on",
  ).map((type) => ({
    type,
    details: String(formData.get(`details_${type}`) ?? "").trim(),
    staticTarget: String(formData.get(`static_target_${type}`) ?? "").trim(),
    reelTarget: String(formData.get(`reel_target_${type}`) ?? "").trim(),
    items: formData.getAll(`items_${type}`).map(String),
  }));
}

async function syncClientServices(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  clientId: string,
  formData: FormData,
) {
  const selected = readSelectedServices(formData);
  const selectedTypes = selected.map((s) => s.type);
  const unselected = SERVICE_TYPES.filter(
    (type: ServiceType) => !selectedTypes.includes(type),
  );

  // These three touch independent rows, so they run concurrently rather
  // than as a chain of sequential round-trips.
  await Promise.all([
    selected.length > 0
      ? supabase.from("client_services").upsert(
          selected.map(({ type, details, staticTarget, reelTarget }) => ({
            client_id: clientId,
            service_type: type,
            details: details || null,
            ...(type === "social_media"
              ? {
                  static_target: toIntOrNull(staticTarget),
                  reel_target: toIntOrNull(reelTarget),
                }
              : {}),
          })),
          { onConflict: "client_id,service_type" },
        )
      : Promise.resolve(),
    unselected.length > 0
      ? supabase
          .from("client_services")
          .delete()
          .eq("client_id", clientId)
          .in("service_type", unselected)
      : Promise.resolve(),
    // Rewriting the client's full sub-item set (wipe + bulk insert) instead
    // of a delete+insert per service avoids a chain of round-trips.
    supabase.from("client_service_items").delete().eq("client_id", clientId),
  ]);

  const allItems = selected.flatMap(({ type, items }) =>
    items.map((item) => ({ client_id: clientId, service_type: type, item })),
  );
  if (allItems.length > 0) {
    await supabase.from("client_service_items").insert(allItems);
  }
}

export async function createClientRecord(
  _prevState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const values = readRawValues(formData);
  const parsed = parseClientForm(formData);

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error.issues),
      values,
      services: readSelectedServices(formData),
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { companyName, contactName, contactEmail, phone, website, status, notes } =
    parsed.data;

  const { data, error } = await supabase
    .from("clients")
    .insert({
      company_name: companyName,
      contact_name: contactName,
      contact_email: contactEmail,
      phone: phone || null,
      website: website || null,
      status,
      notes: notes || null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message, values };
  }

  await syncClientServices(supabase, data.id, formData);

  await logActivity(supabase, {
    type: "client_created",
    actorId: user?.id ?? null,
    message: "added a new client",
    target: companyName,
  });

  revalidatePath("/admin/clients");
  revalidatePath("/admin");
  redirect(`/admin/clients/${data.id}`);
}

export async function updateClientRecord(
  id: string,
  _prevState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const values = readRawValues(formData);
  const parsed = parseClientForm(formData);

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error.issues),
      values,
      services: readSelectedServices(formData),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { companyName, contactName, contactEmail, phone, website, status, notes } =
    parsed.data;

  const { error } = await supabase
    .from("clients")
    .update({
      company_name: companyName,
      contact_name: contactName,
      contact_email: contactEmail,
      phone: phone || null,
      website: website || null,
      status,
      notes: notes || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message, values };
  }

  await syncClientServices(supabase, id, formData);

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  redirect(`/admin/clients/${id}`);
}

export async function deleteClientRecord(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin");
  redirect("/admin/clients");
}

export type LinkPortalActionState = {
  error: string | null;
};

/** Links a client record to an existing client-role login (created via
 * /signup) by email, so that account can see this client's tasks and
 * approvals in the portal. There's no invite-by-email flow yet — the
 * account has to already exist. */
export async function linkClientPortalAccount(
  clientId: string,
  _prevState: LinkPortalActionState,
  formData: FormData,
): Promise<LinkPortalActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Enter the email they signed up with." };
  }

  const { profile, error: lookupError } = await findClientProfileByEmail(email);

  if (lookupError) {
    return { error: lookupError };
  }

  if (!profile) {
    return {
      error:
        "No client account found with that email. They need to sign up first.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("clients")
    .update({ profile_id: profile.id })
    .eq("id", clientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/clients/${clientId}`);
}

export type CreatePortalActionState = {
  error: string | null;
};

/** Creates a brand-new client-role login (via the Supabase Admin API, so
 * the password is hashed by Supabase Auth exactly like a self-signup) and
 * links it to this client immediately — no separate signup step needed. */
export async function createClientPortalAccount(
  clientId: string,
  _prevState: CreatePortalActionState,
  formData: FormData,
): Promise<CreatePortalActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email) {
    return { error: "Enter a login email." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Admin client isn't configured." };
  }

  const { data, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "client" },
  });

  if (createError) {
    return { error: createError.message };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update({ profile_id: data.user.id })
    .eq("id", clientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/clients/${clientId}`);
}

export async function unlinkClientPortalAccount(clientId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update({ profile_id: null })
    .eq("id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/clients/${clientId}`);
}

export type WorkStatusActionState = {
  error: string | null;
};

function toTimestampOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Appends a new (blank) slot for a client's static or reel work in a given
 * month — admin fills in its count/approval/dates afterward via
 * updateWorkSlot. */
export async function addWorkSlot(
  clientId: string,
  month: string,
  contentType: SlotContentType,
) {
  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("client_work_slots")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("month", month)
    .eq("content_type", contentType);

  const { error } = await supabase.from("client_work_slots").insert({
    client_id: clientId,
    month,
    content_type: contentType,
    slot_number: (count ?? 0) + 1,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/clients/${clientId}`);
}

/** Updates one slot's completed count, Ready date, and the Team/Client
 * approval ticks. Entering a completed count stamps Ready with the current
 * time if it hasn't been set yet (the admin can still fill in a specific
 * Ready date/time by hand, which takes priority). Ticking Team or Client
 * stamps the current time the first time it's checked; the stamp is
 * preserved on later saves and only clears if the box gets unchecked. */
export async function updateWorkSlot(
  slotId: string,
  clientId: string,
  _prevState: WorkStatusActionState,
  formData: FormData,
): Promise<WorkStatusActionState> {
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("client_work_slots")
    .select("ready_at, sent_to_client_at, client_approved_at")
    .eq("id", slotId)
    .single();

  if (fetchError) return { error: fetchError.message };

  const completedCount =
    toIntOrNull(String(formData.get("completed_count") ?? "0")) ?? 0;
  const submittedReadyAt = toTimestampOrNull(String(formData.get("ready_at") ?? ""));
  const readyAt =
    submittedReadyAt ??
    (completedCount > 0 ? existing.ready_at ?? new Date().toISOString() : null);
  // Marking work Ready means the team has it in hand for the client, so it
  // counts as sending it to the client even if the box wasn't ticked by hand.
  const teamTicked = formData.get("team_ticked") === "on" || readyAt !== null;
  const clientTicked = formData.get("client_ticked") === "on";

  const { error } = await supabase
    .from("client_work_slots")
    .update({
      completed_count: completedCount,
      ready_at: readyAt,
      sent_to_client_at: teamTicked
        ? existing.sent_to_client_at ?? new Date().toISOString()
        : null,
      client_approved_at: clientTicked
        ? existing.client_approved_at ?? new Date().toISOString()
        : null,
    })
    .eq("id", slotId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { error: null };
}

/** Lets the linked client tick their own approval on a slot from their
 * portal — stamps the current time, and only ever touches this one column
 * (enforced by the prevent_slot_tampering trigger for non-admins). Refuses
 * until the team has marked the slot as sent — a client can't approve
 * something that hasn't been shared with them yet. */
export async function approveSlotAsClient(
  slotId: string,
  _prevState: WorkStatusActionState,
): Promise<WorkStatusActionState> {
  const supabase = await createSupabaseServerClient();

  const { data: slot, error: fetchError } = await supabase
    .from("client_work_slots")
    .select("sent_to_client_at")
    .eq("id", slotId)
    .single();

  if (fetchError) return { error: fetchError.message };

  if (!slot.sent_to_client_at) {
    return { error: "The team hasn't shared this yet." };
  }

  const { error } = await supabase
    .from("client_work_slots")
    .update({ client_approved_at: new Date().toISOString() })
    .eq("id", slotId);

  if (error) return { error: error.message };

  revalidatePath("/client");
  return { error: null };
}

export async function deleteWorkSlot(slotId: string, clientId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("client_work_slots")
    .delete()
    .eq("id", slotId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/clients/${clientId}`);
}

/** Updates a client's website status — a standing state, not tracked
 * per-month like the social media numbers. */
export async function updateClientWebsiteStatus(
  clientId: string,
  _prevState: WorkStatusActionState,
  formData: FormData,
): Promise<WorkStatusActionState> {
  const supabase = await createSupabaseServerClient();
  const siteStatus = String(formData.get("site_status") ?? "");

  const { error } = await supabase
    .from("client_services")
    .update({ site_status: (siteStatus || null) as WebsiteStatus | null })
    .eq("client_id", clientId)
    .eq("service_type", "website");

  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { error: null };
}

/** Appends a new (blank) extra-work request for a client in a given month —
 * admin fills in its description/approval afterward via updateExtraWork. */
export async function addExtraWork(clientId: string, month: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("client_extra_work").insert({
    client_id: clientId,
    month,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/clients/${clientId}`);
}

/** Updates one extra-work item's description and the Team/Client approval
 * ticks — same stamp-once-and-preserve behavior as updateWorkSlot. */
export async function updateExtraWork(
  itemId: string,
  clientId: string,
  _prevState: WorkStatusActionState,
  formData: FormData,
): Promise<WorkStatusActionState> {
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("client_extra_work")
    .select("sent_to_client_at, client_approved_at")
    .eq("id", itemId)
    .single();

  if (fetchError) return { error: fetchError.message };

  const teamTicked = formData.get("team_ticked") === "on";
  const clientTicked = formData.get("client_ticked") === "on";

  const { error } = await supabase
    .from("client_extra_work")
    .update({
      description: String(formData.get("description") ?? "").trim(),
      sent_to_client_at: teamTicked
        ? existing.sent_to_client_at ?? new Date().toISOString()
        : null,
      client_approved_at: clientTicked
        ? existing.client_approved_at ?? new Date().toISOString()
        : null,
    })
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { error: null };
}

export async function deleteExtraWork(itemId: string, clientId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("client_extra_work")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/clients/${clientId}`);
}

/** Lets the linked client tick their own approval on an extra-work item —
 * same "team must share first" gate as approveSlotAsClient. */
export async function approveExtraWorkAsClient(
  itemId: string,
  _prevState: WorkStatusActionState,
): Promise<WorkStatusActionState> {
  const supabase = await createSupabaseServerClient();

  const { data: item, error: fetchError } = await supabase
    .from("client_extra_work")
    .select("sent_to_client_at")
    .eq("id", itemId)
    .single();

  if (fetchError) return { error: fetchError.message };

  if (!item.sent_to_client_at) {
    return { error: "The team hasn't shared this yet." };
  }

  const { error } = await supabase
    .from("client_extra_work")
    .update({ client_approved_at: new Date().toISOString() })
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath("/client");
  return { error: null };
}
