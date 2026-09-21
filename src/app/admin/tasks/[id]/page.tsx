import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PriorityBadge, TaskStatusBadge } from "@/components/dashboard/status-badges";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { getTaskById } from "@/lib/tasks/queries";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string | null) {
  if (!iso) return "No due date set";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { task, error } = await getTaskById(id);

  if (error) {
    return <EmptyState title="Couldn't load this task" description={error} />;
  }

  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{task.name}</h1>
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          <p className="text-sm text-muted-foreground">
            {task.client ? (
              <>
                for{" "}
                <Link
                  href={`/admin/clients/${task.client.id}`}
                  className="font-medium hover:text-primary"
                >
                  {task.client.company_name}
                </Link>
              </>
            ) : (
              "No client"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/tasks/${task.id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
          <DeleteTaskDialog
            taskId={task.id}
            taskName={task.name}
            clientId={task.client_id}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">
                  {getInitials(task.assignee_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{task.assignee_name}</p>
                <p className="text-muted-foreground">Assignee</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Due date</p>
              <p className="font-medium">{formatDate(task.due_date)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>What needs to be done.</CardDescription>
          </CardHeader>
          <CardContent>
            {task.description ? (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {task.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No description yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
