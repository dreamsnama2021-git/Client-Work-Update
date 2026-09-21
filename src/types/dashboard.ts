import type { ApprovalWithClient } from "./approval";

export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";

export interface TaskSummary {
  id: string;
  name: string;
  clientName: string;
  assignee: {
    name: string;
    avatarUrl: string | null;
  };
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
}

export type ActivityType =
  | "client_created"
  | "task_created"
  | "task_completed"
  | "approval_requested"
  | "approval_approved"
  | "revision_requested"
  | "message_sent"
  | "file_uploaded";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actorName: string;
  actorAvatarUrl: string | null;
  message: string;
  target: string;
  createdAt: string;
}

export interface DashboardStats {
  totalClients: number;
  pendingApprovals: number;
  pendingRevisions: number;
  tasksDueSoon: number;
}

export interface StatusBreakdown<TStatus extends string> {
  status: TStatus;
  label: string;
  count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  tasks: TaskSummary[];
  activity: ActivityItem[];
  taskStatusBreakdown: StatusBreakdown<TaskStatus>[];
  needsAttentionApprovals: ApprovalWithClient[];
}
