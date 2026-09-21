import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ApprovalsFilterBar } from "@/components/approvals/approvals-filter-bar";
import { ApprovalsTable } from "@/components/approvals/approvals-table";
import { listApprovals } from "@/lib/approvals/queries";
import type { ApprovalStatus } from "@/types/approval";

const VALID_STATUSES: ApprovalStatus[] = ["pending", "approved", "revision_requested"];

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const status = VALID_STATUSES.includes(params.status as ApprovalStatus)
    ? (params.status as ApprovalStatus)
    : "all";
  const q = params.q ?? "";

  const { approvals, error } = await listApprovals({ q, status });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Review client approvals and manage revision requests.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/approvals/new">
            <Plus className="size-4" />
            Submit for Approval
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <ApprovalsFilterBar defaultQuery={q} defaultStatus={status} />

          {error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load approvals"
              description={error}
            />
          ) : (
            <ApprovalsTable
              approvals={approvals}
              hasFilters={Boolean(q) || status !== "all"}
              clientLinkBasePath="/admin/clients"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
