import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Priority, TaskStatus } from "@/types/dashboard";
import type { ApprovalStatus } from "@/types/approval";

const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  todo: { label: "To Do", variant: "outline" },
  in_progress: { label: "In Progress", variant: "default" },
  in_review: { label: "In Review", variant: "warning" },
  done: { label: "Done", variant: "success" },
};

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; variant: BadgeProps["variant"] }
> = {
  low: { label: "Low", variant: "outline" },
  medium: { label: "Medium", variant: "secondary" },
  high: { label: "High", variant: "warning" },
  urgent: { label: "Urgent", variant: "destructive" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = TASK_STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const APPROVAL_STATUS_CONFIG: Record<
  ApprovalStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "success" },
  revision_requested: { label: "Revision Requested", variant: "warning" },
};

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const config = APPROVAL_STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export type ApprovalViewerRole = "admin" | "client";

/** Who currently needs to act on an approval, from the given viewer's
 * perspective — null once it's approved (nobody needs to act). */
export function getApprovalWaitingOnLabel(
  status: ApprovalStatus,
  viewerRole: ApprovalViewerRole,
): string | null {
  if (status === "pending") {
    return viewerRole === "client" ? "Waiting on you" : "Waiting on client";
  }
  if (status === "revision_requested") {
    return viewerRole === "admin" ? "Waiting on you" : "Waiting on agency";
  }
  return null;
}

export function ApprovalWaitingOnBadge({
  status,
  viewerRole,
}: {
  status: ApprovalStatus;
  viewerRole: ApprovalViewerRole;
}) {
  const label = getApprovalWaitingOnLabel(status, viewerRole);
  if (!label) return null;
  return (
    <Badge variant={label === "Waiting on you" ? "warning" : "outline"}>
      {label}
    </Badge>
  );
}
