import type { ActivityItem, DashboardData, TaskStatus, TaskSummary } from "@/types/dashboard";
import { getClientsCount } from "@/lib/clients/queries";
import { listTasks } from "@/lib/tasks/queries";
import type { TaskWithClient } from "@/types/task";
import { listApprovals } from "@/lib/approvals/queries";
import { listRecentActivity } from "@/lib/activity/queries";
import type { ActivityEventWithActor } from "@/types/activity";

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function toTaskSummary(task: TaskWithClient): TaskSummary {
  return {
    id: task.id,
    name: task.name,
    clientName: task.client?.company_name ?? "Unknown client",
    assignee: { name: task.assignee_name, avatarUrl: null },
    status: task.status,
    priority: task.priority,
    dueDate: task.due_date ?? "",
  };
}

function toActivityItem(event: ActivityEventWithActor): ActivityItem {
  return {
    id: event.id,
    type: event.type,
    actorName: event.actor?.full_name || event.actor?.email || "Someone",
    actorAvatarUrl: event.actor?.avatar_url ?? null,
    message: event.message,
    target: event.target,
    createdAt: event.created_at,
  };
}

/**
 * Returns everything the admin dashboard needs to render. Every field now
 * reads the real tables added in Phases 3-9 — this function no longer
 * touches any demo data.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const [totalClients, { tasks: realTasks }, { approvals }, { activity: realActivity }] =
    await Promise.all([
      getClientsCount(),
      listTasks(),
      listApprovals(),
      listRecentActivity(),
    ]);

  const tasks = realTasks.map(toTaskSummary);
  const activity = realActivity.map(toActivityItem);

  const dueSoonCutoff = daysFromNow(7);

  const stats = {
    totalClients,
    pendingApprovals: approvals.filter((a) => a.status === "pending").length,
    pendingRevisions: approvals.filter((a) => a.status === "revision_requested")
      .length,
    tasksDueSoon: tasks.filter(
      (t) => t.status !== "done" && t.dueDate && t.dueDate <= dueSoonCutoff,
    ).length,
  };

  const needsAttentionApprovals = approvals
    .filter((a) => a.status !== "approved")
    .slice(0, 8);

  const taskStatusBreakdown = (
    Object.keys(TASK_STATUS_LABELS) as TaskStatus[]
  ).map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    count: tasks.filter((t) => t.status === status).length,
  }));

  return {
    stats,
    tasks: tasks.slice(0, 8),
    activity,
    taskStatusBreakdown,
    needsAttentionApprovals,
  };
}
