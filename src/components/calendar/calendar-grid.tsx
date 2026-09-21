import Link from "next/link";

import { cn } from "@/lib/utils";
import type { CalendarDay, CalendarEventType } from "@/types/calendar";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_STYLES: Record<CalendarEventType, string> = {
  task_due: "bg-warning/15 text-warning hover:bg-warning/25",
};

const MAX_VISIBLE_EVENTS = 3;

export function CalendarGrid({ days }: { days: CalendarDay[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const visibleEvents = day.events.slice(0, MAX_VISIBLE_EVENTS);
          const overflowCount = day.events.length - visibleEvents.length;

          return (
            <div
              key={day.iso}
              className={cn(
                "min-h-24 border-b border-r border-border p-1.5 last:border-r-0 sm:min-h-28",
                !day.isCurrentMonth && "bg-muted/20",
              )}
            >
              <div
                className={cn(
                  "mb-1 flex size-6 items-center justify-center rounded-full text-xs",
                  day.isToday
                    ? "bg-primary font-semibold text-primary-foreground"
                    : day.isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {day.date.getDate()}
              </div>
              <div className="space-y-1">
                {visibleEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={event.link}
                    className={cn(
                      "block truncate rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                      EVENT_STYLES[event.type],
                    )}
                    title={event.title}
                  >
                    {event.title}
                  </Link>
                ))}
                {overflowCount > 0 && (
                  <p className="px-1.5 text-[11px] text-muted-foreground">
                    +{overflowCount} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
