import Link from "next/link";
import { AlertTriangle, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskForm } from "@/components/tasks/task-form";
import { createTaskRecord } from "@/lib/actions/tasks";
import { listClients } from "@/lib/clients/queries";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const { clients, error } = await listClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Task</h1>
        <p className="text-sm text-muted-foreground">
          Create a new task for a client.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Task details</CardTitle>
          <CardDescription>
            You can edit these details anytime from the task&apos;s page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load clients"
              description={error}
            />
          ) : clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Add a client first"
              description="You need at least one client before you can create a task."
              action={
                <Button asChild>
                  <Link href="/admin/clients/new">Add Client</Link>
                </Button>
              }
            />
          ) : (
            <TaskForm
              clients={clients}
              defaultClientId={clientId}
              action={createTaskRecord}
              submitLabel="Create task"
              cancelHref="/admin/tasks"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
