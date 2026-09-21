import { BarChart3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { StatusBreakdown, TaskStatus } from "@/types/dashboard";

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: "var(--color-muted-foreground)",
  in_progress: "var(--color-primary)",
  in_review: "var(--color-warning)",
  done: "var(--color-success)",
};

export function TaskStatusChart({
  breakdown,
}: {
  breakdown: StatusBreakdown<TaskStatus>[];
}) {
  const total = breakdown.reduce((sum, b) => sum + b.count, 0);
  const max = Math.max(1, ...breakdown.map((b) => b.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Status</CardTitle>
        <CardDescription>Where tasks stand across all clients.</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No task data"
            description="Once tasks exist, their status breakdown appears here."
          />
        ) : (
          <div className="space-y-4">
            {breakdown.map((b) => (
              <div key={b.status} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-medium text-foreground">
                    {b.count}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(b.count / max) * 100}%`,
                      backgroundColor: STATUS_COLOR[b.status],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
