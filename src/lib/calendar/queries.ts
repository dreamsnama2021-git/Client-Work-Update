import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/types/calendar";

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface ListCalendarEventsResult {
  events: CalendarEvent[];
  error: string | null;
}

export async function listCalendarEvents(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<ListCalendarEventsResult> {
  const supabase = await createSupabaseServerClient();
  const start = toIso(rangeStart);
  const end = toIso(rangeEnd);

  const { data, error } = await supabase
    .from("tasks")
    .select("id, name, due_date")
    .not("due_date", "is", null)
    .gte("due_date", start)
    .lte("due_date", end);

  if (error) {
    return { events: [], error: error.message };
  }

  const events: CalendarEvent[] = (data ?? []).map((t) => ({
    id: `task-${t.id}`,
    type: "task_due" as const,
    title: t.name,
    date: t.due_date as string,
    link: `/admin/tasks/${t.id}`,
  }));

  return { events, error: null };
}
