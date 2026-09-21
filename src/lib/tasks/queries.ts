import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { TaskFilters, TaskWithClient } from "@/types/task";

export interface ListTasksResult {
  tasks: TaskWithClient[];
  error: string | null;
}

const TASK_WITH_CLIENT_SELECT = "*, client:clients(id, company_name)";

export async function listTasks(
  filters: TaskFilters = {},
): Promise<ListTasksResult> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("tasks")
    .select(TASK_WITH_CLIENT_SELECT)
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
      query = query.or(`name.ilike.%${term}%,assignee_name.ilike.%${term}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    return { tasks: [], error: error.message };
  }

  return { tasks: (data ?? []) as unknown as TaskWithClient[], error: null };
}

export interface GetTaskResult {
  task: TaskWithClient | null;
  error: string | null;
}

export async function getTaskById(id: string): Promise<GetTaskResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_WITH_CLIENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { task: null, error: error.message };
  }

  return { task: data as unknown as TaskWithClient | null, error: null };
}
