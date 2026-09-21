import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}

export function PlaceholderPage({
  icon: Icon,
  title,
  description,
  phase,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>

      <Card className="mt-6">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Coming in {phase}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              This section is wired into navigation now and will be built
              out with real functionality in {phase}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
