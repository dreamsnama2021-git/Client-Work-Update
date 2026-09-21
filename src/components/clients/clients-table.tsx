import Link from "next/link";
import { Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Client } from "@/types/client";
import { ClientStatusBadge } from "./client-status-badge";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ClientsTable({
  clients,
  hasFilters,
}: {
  clients: Client[];
  hasFilters: boolean;
}) {
  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={hasFilters ? "No clients match your filters" : "No clients yet"}
        description={
          hasFilters
            ? "Try a different search term or status filter."
            : "Add your first client to start tracking their tasks and approvals."
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Added</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="p-0">
              <Link
                href={`/admin/clients/${client.id}`}
                className="flex items-center gap-3 px-4 py-3 font-medium hover:text-primary"
              >
                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(client.company_name)}
                  </AvatarFallback>
                </Avatar>
                {client.company_name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {client.contact_name}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {client.contact_email}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {client.phone || "—"}
            </TableCell>
            <TableCell>
              <ClientStatusBadge status={client.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(client.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
