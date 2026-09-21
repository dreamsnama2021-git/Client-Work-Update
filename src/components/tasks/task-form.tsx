"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TaskActionState } from "@/lib/actions/tasks";
import type { TaskWithClient } from "@/types/task";

const initialState: TaskActionState = { error: null };

interface TaskFormProps {
  task?: TaskWithClient;
  clients: { id: string; company_name: string }[];
  defaultClientId?: string;
  action: (
    state: TaskActionState,
    formData: FormData,
  ) => Promise<TaskActionState>;
  submitLabel: string;
  cancelHref: string;
}

export function TaskForm({
  task,
  clients,
  defaultClientId,
  action,
  submitLabel,
  cancelHref,
}: TaskFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldErrors = state.fieldErrors ?? {};
  const values = state.values;

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Task name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={values?.name ?? task?.name}
            placeholder="Design homepage hero"
            required
          />
          {fieldErrors.name && (
            <p className="text-xs text-destructive">{fieldErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientId">Client</Label>
          <Select
            id="clientId"
            name="clientId"
            defaultValue={values?.clientId ?? task?.client_id ?? defaultClientId ?? ""}
            required
          >
            <option value="" disabled>
              Select a client
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company_name}
              </option>
            ))}
          </Select>
          {fieldErrors.clientId && (
            <p className="text-xs text-destructive">{fieldErrors.clientId}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigneeName">Assignee</Label>
          <Input
            id="assigneeName"
            name="assigneeName"
            defaultValue={values?.assigneeName ?? task?.assignee_name}
            placeholder="Jane Doe"
            required
          />
          {fieldErrors.assigneeName && (
            <p className="text-xs text-destructive">{fieldErrors.assigneeName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={values?.status ?? task?.status ?? "todo"}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Done</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            id="priority"
            name="priority"
            defaultValue={values?.priority ?? task?.priority ?? "medium"}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={values?.dueDate ?? task?.due_date ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={values?.description ?? task?.description ?? ""}
          placeholder="What needs to be done…"
          rows={4}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
        <Button variant="outline" type="button" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
