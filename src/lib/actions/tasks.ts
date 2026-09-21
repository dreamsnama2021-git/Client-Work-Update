"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity/log";

const taskSchema = z.object({
  name: z.string().trim().min(1, "Task name is required").max(200),
  clientId: z.string().trim().min(1, "Select a client"),
  assigneeName: z.string().trim().min(1, "Assignee is required").max(100),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(["todo", "in_progress", "in_review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().trim().optional().or(z.literal("")),
});

export type TaskFormRawValues = {
  name: string;
  clientId: string;
  assigneeName: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
};

export type TaskActionState = {
  error: string | null;
  fieldErrors?: Record<string, string>;
  values?: TaskFormRawValues;
};

function readRawValues(formData: FormData): TaskFormRawValues {
  return {
    name: String(formData.get("name") ?? ""),
    clientId: String(formData.get("clientId") ?? ""),
    assigneeName: String(formData.get("assigneeName") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? "todo"),
    priority: String(formData.get("priority") ?? "medium"),
    dueDate: String(formData.get("dueDate") ?? ""),
  };
}

function parseTaskForm(formData: FormData) {
  return taskSchema.safeParse({
    name: formData.get("name"),
    clientId: formData.get("clientId"),
    assigneeName: formData.get("assigneeName"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
  });
}

function toFieldErrors(issues: z.ZodIssue[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0]);
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createTaskRecord(
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const values = readRawValues(formData);
  const parsed = parseTaskForm(formData);

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error.issues),
      values,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { name, clientId, assigneeName, description, status, priority, dueDate } =
    parsed.data;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      client_id: clientId,
      name,
      assignee_name: assigneeName,
      description: description || null,
      status,
      priority,
      due_date: dueDate || null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message, values };
  }

  await logActivity(supabase, {
    type: "task_created",
    actorId: user?.id ?? null,
    message: "created a new task",
    target: name,
  });

  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/tasks/${data.id}`);
}

export async function updateTaskRecord(
  id: string,
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const values = readRawValues(formData);
  const parsed = parseTaskForm(formData);

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error.issues),
      values,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { name, clientId, assigneeName, description, status, priority, dueDate } =
    parsed.data;

  const { data: existingTask } = await supabase
    .from("tasks")
    .select("status")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("tasks")
    .update({
      client_id: clientId,
      name,
      assignee_name: assigneeName,
      description: description || null,
      status,
      priority,
      due_date: dueDate || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message, values };
  }

  if (status === "done" && existingTask?.status !== "done") {
    await logActivity(supabase, {
      type: "task_completed",
      actorId: user?.id ?? null,
      message: "marked as done",
      target: name,
    });
  }

  revalidatePath("/admin/tasks");
  revalidatePath(`/admin/tasks/${id}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/tasks/${id}`);
}

export async function deleteTaskRecord(id: string, clientId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect("/admin/tasks");
}
