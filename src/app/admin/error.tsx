"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Something went wrong</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            We couldn&apos;t load this page. Try again, and if the problem
            persists, refresh the app.
          </p>
        </div>
        <Button onClick={reset} variant="outline" className="mt-2">
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
