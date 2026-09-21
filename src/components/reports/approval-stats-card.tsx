import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ApprovalStats } from "@/types/reports";

function formatTurnaround(hours: number | null) {
  if (hours === null) return "—";
  if (hours < 24) return `${hours}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export function ApprovalStatsCard({ stats }: { stats: ApprovalStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Turnaround</CardTitle>
        <CardDescription>How approvals are resolving.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-semibold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-success">
              {stats.approved}
            </p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-warning">
              {stats.revisionRequested}
            </p>
            <p className="text-xs text-muted-foreground">Revisions</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">Approval rate</span>
          <span className="font-medium">
            {stats.approvalRate === null ? "—" : `${stats.approvalRate}%`}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Avg. turnaround</span>
          <span className="font-medium">
            {formatTurnaround(stats.avgTurnaroundHours)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
