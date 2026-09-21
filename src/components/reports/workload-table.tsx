import { Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import type { AssigneeWorkload } from "@/types/reports";

export function WorkloadTable({ workload }: { workload: AssigneeWorkload[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workload by Assignee</CardTitle>
        <CardDescription>Task completion across the team.</CardDescription>
      </CardHeader>
      <CardContent>
        {workload.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No tasks yet"
            description="Assignee workload will appear here once tasks exist."
          />
        ) : (
          <ul className="space-y-4">
            {workload.map((entry) => (
              <li key={entry.assigneeName} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{entry.assigneeName}</span>
                  <span className="text-muted-foreground">
                    {entry.done}/{entry.total} done
                  </span>
                </div>
                <Progress value={(entry.done / entry.total) * 100} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
