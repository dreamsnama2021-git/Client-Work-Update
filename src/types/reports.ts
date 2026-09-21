import type { StatusBreakdown, TaskStatus } from "./dashboard";

export interface ReportsTotals {
  clients: number;
  activeClients: number;
  tasks: number;
  approvals: number;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  revisionRequested: number;
  approvalRate: number | null; // approved / (approved + revisionRequested), 0-100
  avgTurnaroundHours: number | null;
}

export interface AssigneeWorkload {
  assigneeName: string;
  total: number;
  done: number;
}

export interface ReportsData {
  totals: ReportsTotals;
  taskStatusBreakdown: StatusBreakdown<TaskStatus>[];
  taskCompletionRate: number | null;
  approvalStats: ApprovalStats;
  workloadByAssignee: AssigneeWorkload[];
}
