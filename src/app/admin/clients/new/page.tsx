import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/client-form";
import { createClientRecord } from "@/lib/actions/clients";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Client</h1>
        <p className="text-sm text-muted-foreground">
          Create a new client record.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Client details</CardTitle>
          <CardDescription>
            You can edit these details anytime from the client&apos;s page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm
            action={createClientRecord}
            submitLabel="Create client"
            cancelHref="/admin/clients"
          />
        </CardContent>
      </Card>
    </div>
  );
}
