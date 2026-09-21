import Link from "next/link";
import { AlertTriangle, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ApprovalForm } from "@/components/approvals/approval-form";
import { createApprovalRecord } from "@/lib/actions/approvals";
import { listClients } from "@/lib/clients/queries";

export default async function NewApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const { clients, error } = await listClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Submit for Approval
        </h1>
        <p className="text-sm text-muted-foreground">
          Send a deliverable to a client for sign-off.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Approval details</CardTitle>
          <CardDescription>
            The client will see this the next time they check their portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load clients"
              description={error}
            />
          ) : clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Add a client first"
              description="You need at least one client before you can request an approval."
              action={
                <Button asChild>
                  <Link href="/admin/clients/new">Add Client</Link>
                </Button>
              }
            />
          ) : (
            <ApprovalForm
              clients={clients}
              defaultClientId={clientId}
              action={createApprovalRecord}
              submitLabel="Submit for approval"
              cancelHref="/admin/approvals"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
