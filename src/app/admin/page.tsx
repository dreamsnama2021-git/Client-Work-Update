import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { ClientsByService } from "@/components/dashboard/clients-by-service";
import { MonthlyWorkOverview } from "@/components/dashboard/monthly-work-overview";
import { TaskStatusChart } from "@/components/dashboard/task-status-chart";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { listClientsByService, listMonthlyWorkForMonth } from "@/lib/clients/queries";
import { parseMonthParam } from "@/lib/month-param";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthQuery } = await searchParams;
  const month = parseMonthParam(monthQuery);

  const [
    { activity, taskStatusBreakdown },
    { groups: clientsByServiceGroups },
    { summaries: monthlyWorkSummaries },
  ] = await Promise.all([
    getDashboardData(),
    listClientsByService(),
    listMonthlyWorkForMonth(month),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          A snapshot of every client and task in flight.
        </p>
      </div>

      <ClientsByService groups={clientsByServiceGroups} />

      <MonthlyWorkOverview month={month} summaries={monthlyWorkSummaries} />

      <TaskStatusChart breakdown={taskStatusBreakdown} />

      <ActivityTimeline activity={activity} />
    </div>
  );
}
