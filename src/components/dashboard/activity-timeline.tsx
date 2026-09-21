import {
  Activity,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  FileUp,
  MessageSquare,
  RotateCcw,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";
import type { ActivityItem, ActivityType } from "@/types/dashboard";

const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  client_created: UserPlus,
  task_created: CheckSquare,
  task_completed: CheckCircle2,
  approval_requested: ClipboardCheck,
  approval_approved: ClipboardCheck,
  revision_requested: RotateCcw,
  message_sent: MessageSquare,
  file_uploaded: FileUp,
};

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  client_created: "text-primary bg-primary/10",
  task_created: "text-muted-foreground bg-muted",
  task_completed: "text-success bg-success/15",
  approval_requested: "text-warning bg-warning/15",
  approval_approved: "text-success bg-success/15",
  revision_requested: "text-destructive bg-destructive/10",
  message_sent: "text-primary bg-primary/10",
  file_uploaded: "text-muted-foreground bg-muted",
};

export function ActivityTimeline({ activity }: { activity: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates across your workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No recent activity"
            description="Updates from your team and clients will appear here."
          />
        ) : (
          <ul className="space-y-5">
            {activity.map((item) => {
              const Icon = ACTIVITY_ICON[item.type];
              return (
                <li key={item.id} className="flex gap-3">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      ACTIVITY_COLOR[item.type],
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{item.actorName}</span>{" "}
                      <span className="text-muted-foreground">
                        {item.message}
                      </span>{" "}
                      <span className="font-medium">{item.target}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
