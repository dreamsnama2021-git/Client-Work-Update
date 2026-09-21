import Link from "next/link";
import { ClipboardCheck, Mail } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ApprovalsTable } from "@/components/approvals/approvals-table";
import { ClientMonthlyWorkView } from "@/components/clients/client-monthly-work-view";
import { ClientServicesCard } from "@/components/clients/client-services-card";
import {
  getMyClientRecord,
  listClientExtraWork,
  listClientServiceItems,
  listClientServices,
  listClientWorkSlots,
} from "@/lib/clients/queries";
import { listApprovals } from "@/lib/approvals/queries";
import { parseMonthParam } from "@/lib/month-param";

export default async function ClientDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthQuery } = await searchParams;
  const month = parseMonthParam(monthQuery);

  const { client, error } = await getMyClientRecord();

  if (error) {
    return <EmptyState title="Couldn't load your account" description={error} />;
  }

  if (!client) {
    return (
      <EmptyState
        icon={Mail}
        title="Your account isn't linked yet"
        description="Ask your agency contact to link this email to your client account, then refresh this page."
      />
    );
  }

  const [
    { approvals, error: approvalsError },
    { services },
    { items: serviceItems },
    { slots },
    { items: extraWork },
  ] = await Promise.all([
    listApprovals({ status: "pending" }),
    listClientServices(client.id),
    listClientServiceItems(client.id),
    listClientWorkSlots(client.id, month),
    listClientExtraWork(client.id, month),
  ]);

  const socialMediaService = services.find((s) => s.service_type === "social_media") ?? null;
  const websiteService = services.find((s) => s.service_type === "website") ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {client.company_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what needs your attention.
        </p>
      </div>

      <ClientServicesCard services={services} serviceItems={serviceItems} />

      <ClientMonthlyWorkView
        basePath="/client"
        month={month}
        hasSocialMedia={Boolean(socialMediaService)}
        staticTarget={socialMediaService?.static_target ?? null}
        reelTarget={socialMediaService?.reel_target ?? null}
        slots={slots}
        extraWork={extraWork}
        website={websiteService}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5" />
            Needs your review
          </CardTitle>
          <CardDescription>
            Deliverables waiting for your approval or feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approvalsError ? (
            <EmptyState title="Couldn't load approvals" description={approvalsError} />
          ) : (
            <ApprovalsTable
              approvals={approvals}
              hasFilters={false}
              hideClientColumn
              detailBasePath="/client/approvals"
              viewerRole="client"
            />
          )}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/client/approvals" className="text-primary hover:underline">
          View all approvals
        </Link>
      </p>
    </div>
  );
}
