import Link from "next/link";
import { Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SERVICE_LABELS } from "@/types/client";
import type { ClientsByServiceGroup } from "@/lib/clients/queries";

export function ClientsByService({ groups }: { groups: ClientsByServiceGroup[] }) {
  const nonEmptyGroups = groups.filter((group) => group.clients.length > 0);

  if (nonEmptyGroups.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <EmptyState
            icon={Users}
            title="No services assigned yet"
            description="Add services to your clients to see them grouped here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {nonEmptyGroups.map((group) => (
        <Card key={group.serviceType}>
          <CardHeader>
            <CardTitle>{SERVICE_LABELS[group.serviceType]} Clients</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {group.clients.map((client) => (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {client.company_name}
              </Link>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
