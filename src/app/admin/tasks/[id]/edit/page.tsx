import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskForm } from "@/components/tasks/task-form";
import { updateTaskRecord } from "@/lib/actions/tasks";
import { listClients } from "@/lib/clients/queries";
import { getTaskById } from "@/lib/tasks/queries";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ task, error }, { clients }] = await Promise.all([
    getTaskById(id),
    listClients(),
  ]);

  if (error) {
    return <EmptyState title="Couldn't load this task" description={error} />;
  }

  if (!task) {
    notFound();
  }

  const updateWithId = updateTaskRecord.bind(null, task.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit {task.name}</h1>
        <p className="text-sm text-muted-foreground">
          Update this task&apos;s details.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Task details</CardTitle>
          <CardDescription>
            Changes are saved immediately once you submit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm
            task={task}
            clients={clients}
            action={updateWithId}
            submitLabel="Save changes"
            cancelHref={`/admin/tasks/${task.id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
