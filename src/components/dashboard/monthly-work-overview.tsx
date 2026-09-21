import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adjacentMonths, formatMonthLabel } from "@/lib/month-param";
import type { ClientMonthlyWorkSummary } from "@/lib/clients/queries";

export function MonthlyWorkOverview({
  month,
  summaries,
}: {
  month: string;
  summaries: ClientMonthlyWorkSummary[];
}) {
  const { prev, next } = adjacentMonths(month);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Monthly Work</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild className="size-8">
            <Link href={`/admin?month=${prev}`}>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <p className="w-32 text-center text-sm font-medium">
            {formatMonthLabel(month)}
          </p>
          <Button variant="outline" size="icon" asChild className="size-8">
            <Link href={`/admin?month=${next}`}>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {summaries.length === 0 ? (
          <EmptyState
            title="No social media clients yet"
            description="Add the Social Media service to a client to see monthly progress here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Static</TableHead>
                <TableHead>Reel</TableHead>
                <TableHead>Total Post</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((s) => {
                const totalTarget =
                  s.staticTarget !== null || s.reelTarget !== null
                    ? (s.staticTarget ?? 0) + (s.reelTarget ?? 0)
                    : null;
                const totalCompleted = s.staticCompleted + s.reelCompleted;
                return (
                  <TableRow key={s.client.id}>
                    <TableCell className="p-0">
                      <Link
                        href={`/admin/clients/${s.client.id}`}
                        className="block px-4 py-3 font-medium hover:text-primary"
                      >
                        {s.client.company_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.staticCompleted}
                      {s.staticTarget !== null ? `/${s.staticTarget}` : ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.reelCompleted}
                      {s.reelTarget !== null ? `/${s.reelTarget}` : ""}
                    </TableCell>
                    <TableCell className="font-medium">
                      {totalCompleted}
                      {totalTarget !== null ? `/${totalTarget}` : ""}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
