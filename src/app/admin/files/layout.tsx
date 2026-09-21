import { AlertTriangle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FileGroupsList } from "@/components/files/file-groups-list";
import { TwoPaneShell } from "@/components/shared/two-pane-shell";
import { listFileGroups } from "@/lib/files/queries";

export default async function FilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { groups, error } = await listFileGroups();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
        <p className="text-sm text-muted-foreground">
          Upload, organize, and share deliverables with clients.
        </p>
      </div>

      <Card className="flex h-[70vh] min-h-[420px] overflow-hidden p-0">
        <TwoPaneShell
          basePath="/admin/files"
          listPane={
            error ? (
              <div className="p-4">
                <EmptyState
                  icon={AlertTriangle}
                  title="Couldn't load clients"
                  description={error}
                />
              </div>
            ) : (
              <FileGroupsList groups={groups} basePath="/admin/files" />
            )
          }
        >
          {children}
        </TwoPaneShell>
      </Card>
    </div>
  );
}
