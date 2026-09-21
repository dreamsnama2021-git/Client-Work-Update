import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TasksFilterBar } from "@/components/tasks/tasks-filter-bar";
import { TasksTable } from "@/components/tasks/tasks-table";
import { listTasks } from "@/lib/tasks/queries";
import type { TaskStatus } from "@/types/task";

const VALID_STATUSES: TaskStatus[] = ["todo", "in_progress", "in_review", "done"];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const status = VALID_STATUSES.includes(params.status as TaskStatus)
    ? (params.status as TaskStatus)
    : "all";
  const q = params.q ?? "";

  const { tasks, error } = await listTasks({ q, status });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Assign, prioritize, and track work across your team.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/tasks/new">
            <Plus className="size-4" />
            Add Task
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <TasksFilterBar defaultQuery={q} defaultStatus={status} />

          {error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load tasks"
              description={error}
            />
          ) : (
            <TasksTable tasks={tasks} hasFilters={Boolean(q) || status !== "all"} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
