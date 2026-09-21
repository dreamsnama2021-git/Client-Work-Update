import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar";
import { ClientsTable } from "@/components/clients/clients-table";
import { listClients } from "@/lib/clients/queries";
import type { ClientStatus } from "@/types/client";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const status =
    params.status === "active" || params.status === "inactive"
      ? (params.status as ClientStatus)
      : "all";
  const q = params.q ?? "";

  const { clients, error } = await listClients({ q, status });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage every client account, contact, and workspace.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/clients/new">
            <Plus className="size-4" />
            Add Client
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <ClientsFilterBar defaultQuery={q} defaultStatus={status} />

          {error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load clients"
              description={error}
            />
          ) : (
            <ClientsTable clients={clients} hasFilters={Boolean(q) || status !== "all"} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
