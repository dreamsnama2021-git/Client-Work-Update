import Link from "next/link";
import { notFound } from "next/navigation";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ApprovalStatusBadge } from "@/components/dashboard/status-badges";
import { getApprovalById } from "@/lib/approvals/queries";
import { resubmitApproval } from "@/lib/actions/approvals";

function formatDateTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { approval, error } = await getApprovalById(id);

  if (error) {
    return <EmptyState title="Couldn't load this approval" description={error} />;
  }

  if (!approval) {
    notFound();
  }

  const resubmitWithIds = resubmitApproval.bind(
    null,
    approval.id,
    approval.client_id,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {approval.title}
            </h1>
            <ApprovalStatusBadge status={approval.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {approval.client ? (
              <>
                for{" "}
                <Link
                  href={`/admin/clients/${approval.client.id}`}
                  className="font-medium hover:text-primary"
                >
                  {approval.client.company_name}
                </Link>
              </>
            ) : (
              "No client"
            )}
          </p>
        </div>
        {approval.status === "revision_requested" && (
          <form action={resubmitWithIds}>
            <Button type="submit" variant="outline">
              <RotateCcw className="size-4" />
              Resubmit for approval
            </Button>
          </form>
        )}
      </div>

      {approval.status === "revision_requested" && approval.feedback && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-warning">Revision requested</CardTitle>
            <CardDescription>
              {formatDateTime(approval.reviewed_at) &&
                `Sent back ${formatDateTime(approval.reviewed_at)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{approval.feedback}</p>
          </CardContent>
        </Card>
      )}

      {approval.status === "approved" && (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="py-4 text-sm">
            Approved
            {formatDateTime(approval.reviewed_at) &&
              ` on ${formatDateTime(approval.reviewed_at)}`}
            .
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>What was sent for review.</CardDescription>
        </CardHeader>
        <CardContent>
          {approval.description ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {approval.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No description provided.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
