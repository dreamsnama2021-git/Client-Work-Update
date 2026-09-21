import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientForm } from "@/components/clients/client-form";
import { updateClientRecord } from "@/lib/actions/clients";
import {
  getClientById,
  listClientServiceItems,
  listClientServices,
} from "@/lib/clients/queries";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { client, error } = await getClientById(id);

  if (error) {
    return <EmptyState title="Couldn't load this client" description={error} />;
  }

  if (!client) {
    notFound();
  }

  const [{ services }, { items: serviceItems }] = await Promise.all([
    listClientServices(client.id),
    listClientServiceItems(client.id),
  ]);
  const updateWithId = updateClientRecord.bind(null, client.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit {client.company_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Update this client&apos;s details.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Client details</CardTitle>
          <CardDescription>
            Changes are saved immediately once you submit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm
            client={client}
            initialServices={services}
            initialServiceItems={serviceItems}
            action={updateWithId}
            submitLabel="Save changes"
            cancelHref={`/admin/clients/${client.id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
