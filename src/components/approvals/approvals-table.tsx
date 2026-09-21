import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApprovalStatusBadge,
  ApprovalWaitingOnBadge,
  type ApprovalViewerRole,
} from "@/components/dashboard/status-badges";
import type { ApprovalWithClient } from "@/types/approval";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ApprovalsTable({
  approvals,
  hasFilters,
  hideClientColumn = false,
  detailBasePath = "/admin/approvals",
  clientLinkBasePath,
  viewerRole = "admin",
}: {
  approvals: ApprovalWithClient[];
  hasFilters: boolean;
  hideClientColumn?: boolean;
  detailBasePath?: string;
  /** Base path for linking to the client column, e.g. "/admin/clients".
   * Omit to render the client name as plain text (used in the client
   * portal). */
  clientLinkBasePath?: string;
  /** Whose perspective the "Waiting on" column is phrased from. */
  viewerRole?: ApprovalViewerRole;
}) {
  if (approvals.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title={hasFilters ? "No approvals match your filters" : "No approvals yet"}
        description={
          hasFilters
            ? "Try a different search term or status filter."
            : "Submit a deliverable for client sign-off to get started."
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          {!hideClientColumn && <TableHead>Client</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Waiting on</TableHead>
          <TableHead>Submitted</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {approvals.map((approval) => (
          <TableRow key={approval.id}>
            <TableCell className="p-0">
              <Link
                href={`${detailBasePath}/${approval.id}`}
                className="block px-4 py-3 font-medium hover:text-primary"
              >
                {approval.title}
              </Link>
            </TableCell>
            {!hideClientColumn && (
              <TableCell className="text-muted-foreground">
                {approval.client ? (
                  clientLinkBasePath ? (
                    <Link
                      href={`${clientLinkBasePath}/${approval.client.id}`}
                      className="hover:text-primary"
                    >
                      {approval.client.company_name}
                    </Link>
                  ) : (
                    approval.client.company_name
                  )
                ) : (
                  "—"
                )}
              </TableCell>
            )}
            <TableCell>
              <ApprovalStatusBadge status={approval.status} />
            </TableCell>
            <TableCell>
              <ApprovalWaitingOnBadge
                status={approval.status}
                viewerRole={viewerRole}
              />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(approval.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
