import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { buildCalendarDays, getMonthGridRange } from "@/lib/calendar/grid";
import { listCalendarEvents } from "@/lib/calendar/queries";

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

function parseMonthParam(month: string | undefined) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, m] = month.split("-").map(Number);
    return { year, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function monthParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthQuery } = await searchParams;
  const { year, month } = parseMonthParam(monthQuery);

  const { gridStart, gridEnd } = getMonthGridRange(year, month);
  const { events, error } = await listCalendarEvents(gridStart, gridEnd);
  const days = buildCalendarDays(year, month, events);

  const prevMonth = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Every task due date at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/admin/calendar?month=${monthParam(prevMonth.year, prevMonth.month)}`}>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <p className="w-36 text-center text-sm font-medium">
            {MONTH_LABEL.format(new Date(year, month, 1))}
          </p>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/admin/calendar?month=${monthParam(nextMonth.year, nextMonth.month)}`}>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState title="Couldn't load the calendar" description={error} />
          </CardContent>
        </Card>
      ) : (
        <CalendarGrid days={days} />
      )}
    </div>
  );
}
