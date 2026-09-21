import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ApprovalStatusBadge } from "@/components/dashboard/status-badges";
import { ApprovalResponseForm } from "@/components/approvals/approval-response-form";
import { getApprovalById } from "@/lib/approvals/queries";
import { respondToApproval } from "@/lib/actions/approvals";

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

export default async function ClientApprovalDetailPage({
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

  const respondAction = respondToApproval.bind(null, approval.id);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {approval.title}
          </h1>
          <ApprovalStatusBadge status={approval.status} />
        </div>
        {approval.client && (
          <p className="text-sm text-muted-foreground">{approval.client.company_name}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>What&apos;s being sent for review.</CardDescription>
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

      {approval.status === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle>Your response</CardTitle>
            <CardDescription>
              Approve this as-is, or send it back with what needs to change.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApprovalResponseForm action={respondAction} />
          </CardContent>
        </Card>
      )}

      {approval.status === "approved" && (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="py-4 text-sm">
            You approved this
            {formatDateTime(approval.reviewed_at) &&
              ` on ${formatDateTime(approval.reviewed_at)}`}
            .
          </CardContent>
        </Card>
      )}

      {approval.status === "revision_requested" && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-warning">
              You requested a revision
            </CardTitle>
            <CardDescription>
              {formatDateTime(approval.reviewed_at) &&
                `Sent ${formatDateTime(approval.reviewed_at)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{approval.feedback}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
