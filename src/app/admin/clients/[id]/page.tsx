import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Mail, Pencil, Phone, Plus } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientServicesCard } from "@/components/clients/client-services-card";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { ClientWorkStatusCard } from "@/components/clients/client-work-status-card";
import { DeleteClientDialog } from "@/components/clients/delete-client-dialog";
import { PortalAccessCard } from "@/components/clients/portal-access-card";
import { TasksTable } from "@/components/tasks/tasks-table";
import { ApprovalsTable } from "@/components/approvals/approvals-table";
import {
  getClientById,
  getPortalAccountEmail,
  listClientExtraWork,
  listClientServiceItems,
  listClientServices,
  listClientWorkSlots,
} from "@/lib/clients/queries";
import { listTasks } from "@/lib/tasks/queries";
import { listApprovals } from "@/lib/approvals/queries";
import { parseMonthParam } from "@/lib/month-param";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const { month: monthQuery } = await searchParams;
  const month = parseMonthParam(monthQuery);

  const { client, error } = await getClientById(id);

  if (error) {
    return (
      <EmptyState
        title="Couldn't load this client"
        description={error}
      />
    );
  }

  if (!client) {
    notFound();
  }

  const [
    { tasks, error: tasksError },
    { approvals, error: approvalsError },
    linkedEmail,
    { services },
    { items: serviceItems },
    { slots },
    { items: extraWork },
  ] = await Promise.all([
    listTasks({ clientId: client.id }),
    listApprovals({ clientId: client.id }),
    client.profile_id ? getPortalAccountEmail(client.profile_id) : Promise.resolve(null),
    listClientServices(client.id),
    listClientServiceItems(client.id),
    listClientWorkSlots(client.id, month),
    listClientExtraWork(client.id, month),
  ]);

  const socialMediaService = services.find((s) => s.service_type === "social_media") ?? null;
  const websiteService = services.find((s) => s.service_type === "website") ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-12">
            <AvatarFallback className="text-base">
              {getInitials(client.company_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {client.company_name}
              </h1>
              <ClientStatusBadge status={client.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Client since {formatDate(client.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/clients/${client.id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
          <DeleteClientDialog
            clientId={client.id}
            clientName={client.company_name}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">{client.contact_name}</p>
              <p className="text-muted-foreground">Primary contact</p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-4 shrink-0" />
              <a
                href={`mailto:${client.contact_email}`}
                className="truncate hover:text-primary"
              >
                {client.contact_email}
              </a>
            </div>
            {client.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4 shrink-0" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.website && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="size-4 shrink-0" />
                <a
                  href={
                    client.website.startsWith("http")
                      ? client.website
                      : `https://${client.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="truncate hover:text-primary"
                >
                  {client.website}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Internal notes, not visible to the client.</CardDescription>
          </CardHeader>
          <CardContent>
            {client.notes ? (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {client.notes}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <ClientServicesCard services={services} serviceItems={serviceItems} />

      <ClientWorkStatusCard
        clientId={client.id}
        month={month}
        hasSocialMedia={Boolean(socialMediaService)}
        staticTarget={socialMediaService?.static_target ?? null}
        reelTarget={socialMediaService?.reel_target ?? null}
        slots={slots}
        extraWork={extraWork}
        website={websiteService}
      />

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Work in progress for this client.</CardDescription>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/tasks/new?clientId=${client.id}`}>
              <Plus className="size-4" />
              Add Task
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {tasksError ? (
            <EmptyState title="Couldn't load tasks" description={tasksError} />
          ) : (
            <TasksTable tasks={tasks} hasFilters={false} hideClientColumn />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Approvals</CardTitle>
            <CardDescription>Deliverables sent to this client for sign-off.</CardDescription>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/approvals/new?clientId=${client.id}`}>
              <Plus className="size-4" />
              Submit for Approval
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {approvalsError ? (
            <EmptyState title="Couldn't load approvals" description={approvalsError} />
          ) : (
            <ApprovalsTable approvals={approvals} hasFilters={false} hideClientColumn />
          )}
        </CardContent>
      </Card>

      <PortalAccessCard clientId={client.id} linkedEmail={linkedEmail} />
    </div>
  );
}
