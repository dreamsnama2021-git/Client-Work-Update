import {
  CheckSquare,
  ClipboardCheck,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskStatusChart } from "@/components/dashboard/task-status-chart";
import { ApprovalStatsCard } from "@/components/reports/approval-stats-card";
import { WorkloadTable } from "@/components/reports/workload-table";
import { getReportsData } from "@/lib/reports/queries";

export default async function ReportsPage() {
  const { data, error } = await getReportsData();

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Deeper analytics on team output and client activity.
          </p>
        </div>
        <Card>
          <CardContent className="py-10">
            <EmptyState
              title="Couldn't load reports"
              description={error ?? "Unknown error"}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { totals, taskCompletionRate } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Deeper analytics on team output and client activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Active Clients"
          value={totals.activeClients}
          icon={Users}
          accentClassName="bg-primary/10 text-primary"
        />
        <StatCard
          label="Total Tasks"
          value={totals.tasks}
          icon={CheckSquare}
          accentClassName="bg-warning/15 text-warning"
        />
        <StatCard
          label="Total Approvals"
          value={totals.approvals}
          icon={ClipboardCheck}
          accentClassName="bg-success/15 text-success"
        />
      </div>

      <Card>
        <CardContent className="space-y-2 p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Task completion rate</span>
            <span className="text-muted-foreground">
              {taskCompletionRate === null ? "—" : `${taskCompletionRate}%`}
            </span>
          </div>
          <Progress value={taskCompletionRate ?? 0} />
        </CardContent>
      </Card>

      <TaskStatusChart breakdown={data.taskStatusBreakdown} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ApprovalStatsCard stats={data.approvalStats} />
        <WorkloadTable workload={data.workloadByAssignee} />
      </div>
    </div>
  );
}
