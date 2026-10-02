import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { SERVICE_TYPES } from "@/types/client";
import type {
  Client,
  ClientExtraWork,
  ClientFilters,
  ClientReferenceWithNotes,
  ClientService,
  ClientServiceItem,
  ClientWorkPostWithRevisions,
  ServiceType,
} from "@/types/client";

export interface ListClientsResult {
  clients: Client[];
  error: string | null;
}

export async function listClients(
  filters: ClientFilters = {},
): Promise<ListClientsResult> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.q) {
    const term = filters.q.trim();
    if (term) {
      query = query.or(
        `company_name.ilike.%${term}%,contact_name.ilike.%${term}%,contact_email.ilike.%${term}%`,
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    return { clients: [], error: error.message };
  }

  return { clients: data ?? [], error: null };
}

export interface GetClientResult {
  client: Client | null;
  error: string | null;
}

export async function getClientById(id: string): Promise<GetClientResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { client: null, error: error.message };
  }

  return { client: data, error: null };
}

export async function getClientsCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const { count, error } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true });

  if (error || count === null) {
    return 0;
  }

  return count;
}

/** The client-portal record for the currently signed-in user, if their
 * account has been linked to one by an admin. */
export async function getMyClientRecord(): Promise<GetClientResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { client: null, error: null };
  }

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    return { client: null, error: error.message };
  }

  return { client: data, error: null };
}

export async function getPortalAccountEmail(
  profileId: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .maybeSingle();

  return data?.email ?? null;
}

export interface ListClientServicesResult {
  services: ClientService[];
  error: string | null;
}

export async function listClientServices(
  clientId: string,
): Promise<ListClientServicesResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("client_services")
    .select("*")
    .eq("client_id", clientId);

  if (error) {
    return { services: [], error: error.message };
  }

  return { services: data ?? [], error: null };
}

export interface ListClientServiceItemsResult {
  items: ClientServiceItem[];
  error: string | null;
}

export async function listClientServiceItems(
  clientId: string,
): Promise<ListClientServiceItemsResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("client_service_items")
    .select("*")
    .eq("client_id", clientId);

  if (error) {
    return { items: [], error: error.message };
  }

  return { items: data ?? [], error: null };
}

export interface ClientsByServiceGroup {
  serviceType: ServiceType;
  clients: { id: string; company_name: string }[];
}

export interface ListClientsByServiceResult {
  groups: ClientsByServiceGroup[];
  error: string | null;
}

/** All clients grouped by which service they're signed up for, for the
 * admin dashboard's "clients by service" overview. */
export async function listClientsByService(): Promise<ListClientsByServiceResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("client_services")
    .select("service_type, client:clients(id, company_name)");

  if (error) {
    return { groups: [], error: error.message };
  }

  const rows = data as unknown as {
    service_type: ServiceType;
    client: { id: string; company_name: string } | null;
  }[];

  const groups = SERVICE_TYPES.map((type) => ({
    serviceType: type,
    clients: rows
      .filter((row) => row.service_type === type && row.client)
      .map((row) => row.client!)
      .sort((a, b) => a.company_name.localeCompare(b.company_name)),
  }));

  return { groups, error: null };
}

export interface ListClientExtraWorkResult {
  items: ClientExtraWork[];
  error: string | null;
}

/** A client's ad-hoc extra work requests for one calendar month, oldest
 * first. `month` must be a first-of-month ISO date, e.g. "2026-09-01". */
export async function listClientExtraWork(
  clientId: string,
  month: string,
): Promise<ListClientExtraWorkResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("client_extra_work")
    .select("*")
    .eq("client_id", clientId)
    .eq("month", month)
    .order("created_at", { ascending: true });

  if (error) {
    return { items: [], error: error.message };
  }

  return { items: data ?? [], error: null };
}

export interface ListClientReferencesResult {
  references: ClientReferenceWithNotes[];
  error: string | null;
}

/** A client's reference links for one calendar month, oldest first — a
 * free-form list with no target count, unlike the Static/Reel slots.
 * `month` must be a first-of-month ISO date, e.g. "2026-09-01". */
export async function listClientReferences(
  clientId: string,
  month: string,
): Promise<ListClientReferencesResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("client_references")
    .select("*, notes:client_reference_notes(*)")
    .eq("client_id", clientId)
    .eq("month", month)
    .order("created_at", { ascending: true })
    .order("created_at", { referencedTable: "client_reference_notes", ascending: true });

  if (error) {
    return { references: [], error: error.message };
  }

  return { references: (data ?? []) as unknown as ClientReferenceWithNotes[], error: null };
}

export interface ListClientWorkPostsResult {
  posts: ClientWorkPostWithRevisions[];
  error: string | null;
}

/** A client's Post-template static/reel deliverables for one calendar
 * month, oldest first, each with its revision history ordered by revision
 * number. `month` must be a first-of-month ISO date, e.g. "2026-09-01". */
export async function listClientWorkPosts(
  clientId: string,
  month: string,
): Promise<ListClientWorkPostsResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("client_work_posts")
    .select("*, revisions:client_work_post_revisions(*, notes:client_work_post_revision_notes(*))")
    .eq("client_id", clientId)
    .eq("month", month)
    .order("content_type", { ascending: true })
    .order("post_number", { ascending: true })
    .order("revision_number", {
      referencedTable: "client_work_post_revisions",
      ascending: true,
    })
    .order("created_at", {
      referencedTable: "client_work_post_revisions.client_work_post_revision_notes",
      ascending: true,
    });

  if (error) {
    return { posts: [], error: error.message };
  }

  return { posts: (data ?? []) as unknown as ClientWorkPostWithRevisions[], error: null };
}

export interface MonthTargets {
  staticTarget: number | null;
  reelTarget: number | null;
}

interface TargetRow {
  month: string;
  static_target: number | null;
  reel_target: number | null;
}

/** The latest override at or before `month` wins; otherwise the client's
 * baseline from client_services. Months are first-of-month ISO dates, so
 * plain string comparison orders them correctly. */
function resolveTargets(
  baseline: MonthTargets,
  overrides: TargetRow[],
  month: string,
): MonthTargets {
  const latest = overrides
    .filter((o) => o.month <= month)
    .sort((a, b) => b.month.localeCompare(a.month))[0];
  return latest
    ? { staticTarget: latest.static_target, reelTarget: latest.reel_target }
    : baseline;
}

/** A client's Static/Reel targets for one month — see resolveTargets. */
export async function getClientMonthTargets(
  clientId: string,
  month: string,
  baseline: MonthTargets,
): Promise<MonthTargets> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("client_month_targets")
    .select("month, static_target, reel_target")
    .eq("client_id", clientId)
    .lte("month", month);

  return resolveTargets(baseline, data ?? [], month);
}

export interface LegacyCompleted {
  static: number;
  reel: number;
}

/** Completed counts logged under the old Slots layout, which can't be turned
 * into posts (no per-post links). Only used for months with no posts, so a
 * month that has moved to posts never double-counts. */
export async function getLegacyCompleted(
  clientId: string,
  month: string,
): Promise<LegacyCompleted> {
  const supabase = await createSupabaseServerClient();

  const [postsResult, slotsResult] = await Promise.all([
    supabase
      .from("client_work_posts")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("month", month),
    supabase
      .from("client_work_slots")
      .select("content_type, completed_count")
      .eq("client_id", clientId)
      .eq("month", month),
  ]);

  const totals: LegacyCompleted = { static: 0, reel: 0 };
  if ((postsResult.count ?? 0) > 0) return totals;
  for (const slot of slotsResult.data ?? []) {
    totals[slot.content_type] += slot.completed_count;
  }
  return totals;
}

export interface ClientMonthlyWorkSummary {
  client: { id: string; company_name: string };
  staticTarget: number | null;
  reelTarget: number | null;
  staticCompleted: number;
  reelCompleted: number;
}

export interface ListMonthlyWorkResult {
  summaries: ClientMonthlyWorkSummary[];
  error: string | null;
}

/** Every social-media client's static/reel progress for one month (posts
 * whose latest revision the client approved), for the admin dashboard's
 * monthly work overview. */
export async function listMonthlyWorkForMonth(
  month: string,
): Promise<ListMonthlyWorkResult> {
  const supabase = await createSupabaseServerClient();

  const [servicesResult, postsResult, targetsResult, slotsResult] = await Promise.all([
    supabase
      .from("client_services")
      .select("static_target, reel_target, client:clients(id, company_name)")
      .eq("service_type", "social_media"),
    supabase
      .from("client_work_posts")
      .select("client_id, content_type, revisions:client_work_post_revisions(revision_number, client_approved_at)")
      .eq("month", month),
    supabase
      .from("client_month_targets")
      .select("client_id, month, static_target, reel_target")
      .lte("month", month),
    supabase
      .from("client_work_slots")
      .select("client_id, content_type, completed_count")
      .eq("month", month),
  ]);

  if (servicesResult.error) {
    return { summaries: [], error: servicesResult.error.message };
  }
  if (postsResult.error) {
    return { summaries: [], error: postsResult.error.message };
  }
  if (targetsResult.error) {
    return { summaries: [], error: targetsResult.error.message };
  }
  if (slotsResult.error) {
    return { summaries: [], error: slotsResult.error.message };
  }

  const services = servicesResult.data as unknown as {
    static_target: number | null;
    reel_target: number | null;
    client: { id: string; company_name: string } | null;
  }[];

  const posts = postsResult.data as unknown as {
    client_id: string;
    content_type: "static" | "reel";
    revisions: { revision_number: number; client_approved_at: string | null }[];
  }[];

  const totalsByClientId = new Map<string, { static: number; reel: number }>();
  for (const post of posts) {
    const latest = [...post.revisions].sort(
      (a, b) => b.revision_number - a.revision_number,
    )[0];
    if (!latest?.client_approved_at) continue;
    const totals = totalsByClientId.get(post.client_id) ?? { static: 0, reel: 0 };
    totals[post.content_type] += 1;
    totalsByClientId.set(post.client_id, totals);
  }

  // Legacy slot counts only count for clients with no posts that month.
  const clientsWithPosts = new Set(posts.map((p) => p.client_id));
  for (const slot of slotsResult.data) {
    if (clientsWithPosts.has(slot.client_id)) continue;
    const totals = totalsByClientId.get(slot.client_id) ?? { static: 0, reel: 0 };
    totals[slot.content_type] += slot.completed_count;
    totalsByClientId.set(slot.client_id, totals);
  }

  const summaries = services
    .filter((s) => s.client)
    .map((s) => {
      const totals = totalsByClientId.get(s.client!.id);
      const targets = resolveTargets(
        { staticTarget: s.static_target, reelTarget: s.reel_target },
        targetsResult.data.filter((t) => t.client_id === s.client!.id),
        month,
      );
      return {
        client: s.client!,
        staticTarget: targets.staticTarget,
        reelTarget: targets.reelTarget,
        staticCompleted: totals?.static ?? 0,
        reelCompleted: totals?.reel ?? 0,
      };
    })
    .sort((a, b) => a.client.company_name.localeCompare(b.client.company_name));

  return { summaries, error: null };
}

export interface FindProfileResult {
  profile: { id: string; email: string | null; full_name: string | null } | null;
  error: string | null;
}

/** Looks up an existing client-role portal account by email, for admins to
 * link to a client record. Requires the account to already exist (created
 * via /signup) — there is no invite-by-email flow yet. */
export async function findClientProfileByEmail(
  email: string,
): Promise<FindProfileResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("email", email.trim().toLowerCase())
    .eq("role", "client")
    .maybeSingle();

  if (error) {
    return { profile: null, error: error.message };
  }

  return { profile: data, error: null };
}
