import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { SERVICE_TYPES } from "@/types/client";
import type {
  Client,
  ClientExtraWork,
  ClientFilters,
  ClientService,
  ClientServiceItem,
  ClientWorkSlot,
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

export interface ListClientWorkSlotsResult {
  slots: ClientWorkSlot[];
  error: string | null;
}

/** A client's static + reel slots for one calendar month, oldest first.
 * `month` must be a first-of-month ISO date, e.g. "2026-09-01". */
export async function listClientWorkSlots(
  clientId: string,
  month: string,
): Promise<ListClientWorkSlotsResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("client_work_slots")
    .select("*")
    .eq("client_id", clientId)
    .eq("month", month)
    .order("content_type", { ascending: true })
    .order("slot_number", { ascending: true });

  if (error) {
    return { slots: [], error: error.message };
  }

  return { slots: data ?? [], error: null };
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

/** Every social-media client's static/reel progress for one month (summed
 * across all their slots), for the admin dashboard's monthly work overview. */
export async function listMonthlyWorkForMonth(
  month: string,
): Promise<ListMonthlyWorkResult> {
  const supabase = await createSupabaseServerClient();

  const [servicesResult, slotsResult] = await Promise.all([
    supabase
      .from("client_services")
      .select("static_target, reel_target, client:clients(id, company_name)")
      .eq("service_type", "social_media"),
    supabase
      .from("client_work_slots")
      .select("client_id, content_type, completed_count")
      .eq("month", month),
  ]);

  if (servicesResult.error) {
    return { summaries: [], error: servicesResult.error.message };
  }
  if (slotsResult.error) {
    return { summaries: [], error: slotsResult.error.message };
  }

  const services = servicesResult.data as unknown as {
    static_target: number | null;
    reel_target: number | null;
    client: { id: string; company_name: string } | null;
  }[];

  const totalsByClientId = new Map<string, { static: number; reel: number }>();
  for (const slot of slotsResult.data) {
    const totals = totalsByClientId.get(slot.client_id) ?? { static: 0, reel: 0 };
    totals[slot.content_type] += slot.completed_count;
    totalsByClientId.set(slot.client_id, totals);
  }

  const summaries = services
    .filter((s) => s.client)
    .map((s) => {
      const totals = totalsByClientId.get(s.client!.id);
      return {
        client: s.client!,
        staticTarget: s.static_target,
        reelTarget: s.reel_target,
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
