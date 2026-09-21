import Link from "next/link";
import { CheckSquare } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PriorityBadge, TaskStatusBadge } from "@/components/dashboard/status-badges";
import type { TaskWithClient } from "@/types/task";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TasksTable({
  tasks,
  hasFilters,
  hideClientColumn = false,
}: {
  tasks: TaskWithClient[];
  hasFilters: boolean;
  hideClientColumn?: boolean;
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title={hasFilters ? "No tasks match your filters" : "No tasks yet"}
        description={
          hasFilters
            ? "Try a different search term or status filter."
            : "Add a task to start tracking work for this client."
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          {!hideClientColumn && <TableHead>Client</TableHead>}
          <TableHead>Assignee</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="p-0">
              <Link
                href={`/admin/tasks/${task.id}`}
                className="block px-4 py-3 font-medium hover:text-primary"
              >
                {task.name}
              </Link>
            </TableCell>
            {!hideClientColumn && (
              <TableCell className="text-muted-foreground">
                {task.client ? (
                  <Link
                    href={`/admin/clients/${task.client.id}`}
                    className="hover:text-primary"
                  >
                    {task.client.company_name}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
            )}
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(task.assignee_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">{task.assignee_name}</span>
              </div>
            </TableCell>
            <TableCell>
              <TaskStatusBadge status={task.status} />
            </TableCell>
            <TableCell>
              <PriorityBadge priority={task.priority} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(task.due_date)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
