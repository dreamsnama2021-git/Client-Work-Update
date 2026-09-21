import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/types/dashboard";
import type { ReportsData } from "@/types/reports";

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export interface GetReportsDataResult {
  data: ReportsData | null;
  error: string | null;
}

export async function getReportsData(): Promise<GetReportsDataResult> {
  const supabase = await createSupabaseServerClient();

  const [clientsResult, tasksResult, approvalsResult] = await Promise.all([
    supabase.from("clients").select("id, status"),
    supabase.from("tasks").select("id, status, assignee_name"),
    supabase
      .from("approvals")
      .select("id, status, created_at, reviewed_at"),
  ]);

  const firstError =
    clientsResult.error ?? tasksResult.error ?? approvalsResult.error;
  if (firstError) {
    return { data: null, error: firstError.message };
  }

  const clients = clientsResult.data ?? [];
  const tasks = tasksResult.data ?? [];
  const approvals = approvalsResult.data ?? [];

  const totals = {
    clients: clients.length,
    activeClients: clients.filter((c) => c.status === "active").length,
    tasks: tasks.length,
    approvals: approvals.length,
  };

  const taskStatusBreakdown = (
    Object.keys(TASK_STATUS_LABELS) as TaskStatus[]
  ).map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    count: tasks.filter((t) => t.status === status).length,
  }));

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const taskCompletionRate =
    tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : null;

  const approved = approvals.filter((a) => a.status === "approved").length;
  const revisionRequested = approvals.filter(
    (a) => a.status === "revision_requested",
  ).length;
  const pending = approvals.filter((a) => a.status === "pending").length;
  const resolvedCount = approved + revisionRequested;
  const approvalRate =
    resolvedCount > 0 ? Math.round((approved / resolvedCount) * 100) : null;

  const turnaroundHours = approvals
    .filter((a) => a.reviewed_at)
    .map(
      (a) =>
        (new Date(a.reviewed_at as string).getTime() -
          new Date(a.created_at).getTime()) /
        (1000 * 60 * 60),
    );
  const avgTurnaroundHours =
    turnaroundHours.length > 0
      ? Math.round(
          (turnaroundHours.reduce((sum, h) => sum + h, 0) /
            turnaroundHours.length) *
            10,
        ) / 10
      : null;

  const workloadMap = new Map<string, { total: number; done: number }>();
  for (const task of tasks) {
    const entry = workloadMap.get(task.assignee_name) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (task.status === "done") entry.done += 1;
    workloadMap.set(task.assignee_name, entry);
  }
  const workloadByAssignee = Array.from(workloadMap.entries())
    .map(([assigneeName, counts]) => ({ assigneeName, ...counts }))
    .sort((a, b) => b.total - a.total);

  return {
    data: {
      totals,
      taskStatusBreakdown,
      taskCompletionRate,
      approvalStats: {
        pending,
        approved,
        revisionRequested,
        approvalRate,
        avgTurnaroundHours,
      },
      workloadByAssignee,
    },
    error: null,
  };
}
