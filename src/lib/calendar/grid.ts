import type { CalendarDay, CalendarEvent } from "@/types/calendar";

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The first and last date shown in a 6-row month grid (including the
 * leading/trailing days from adjacent months that fill out the first and
 * last weeks). */
export function getMonthGridRange(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridEnd.getDate() + 41); // 6 weeks - 1 day

  return { gridStart, gridEnd };
}

export function buildCalendarDays(
  year: number,
  month: number,
  events: CalendarEvent[],
): CalendarDay[] {
  const { gridStart } = getMonthGridRange(year, month);
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = eventsByDate.get(event.date) ?? [];
    list.push(event);
    eventsByDate.set(event.date, list);
  }

  const todayIso = toIso(new Date());
  const days: CalendarDay[] = [];

  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(date.getDate() + i);
    const iso = toIso(date);

    days.push({
      date,
      iso,
      isCurrentMonth: date.getMonth() === month,
      isToday: iso === todayIso,
      events: eventsByDate.get(iso) ?? [],
    });
  }

  return days;
}
