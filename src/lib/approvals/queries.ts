import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApprovalFilters, ApprovalWithClient } from "@/types/approval";

// RLS already scopes rows to what the current user may see (admins see
// everything, a linked client sees only their own approvals), so these
// queries work unmodified from both the admin and client portal.

export interface ListApprovalsResult {
  approvals: ApprovalWithClient[];
  error: string | null;
}

const APPROVAL_WITH_CLIENT_SELECT = "*, client:clients(id, company_name)";

export async function listApprovals(
  filters: ApprovalFilters = {},
): Promise<ListApprovalsResult> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("approvals")
    .select(APPROVAL_WITH_CLIENT_SELECT)
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  if (filters.q) {
    const term = filters.q.trim();
    if (term) {
      query = query.ilike("title", `%${term}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    return { approvals: [], error: error.message };
  }

  return { approvals: (data ?? []) as unknown as ApprovalWithClient[], error: null };
}

export interface GetApprovalResult {
  approval: ApprovalWithClient | null;
  error: string | null;
}

export async function getApprovalById(id: string): Promise<GetApprovalResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("approvals")
    .select(APPROVAL_WITH_CLIENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { approval: null, error: error.message };
  }

  return { approval: data as unknown as ApprovalWithClient | null, error: null };
}
