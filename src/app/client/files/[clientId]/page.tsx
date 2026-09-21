import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { FileList } from "@/components/files/file-list";
import { FileUploadForm } from "@/components/files/file-upload-form";
import { uploadFile } from "@/lib/actions/files";
import { listFilesForClient } from "@/lib/files/queries";
import { getClientById } from "@/lib/clients/queries";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ClientFilesDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ client, error: clientError }, { files, error: filesError }] =
    await Promise.all([
      getClientById(clientId),
      listFilesForClient(clientId),
    ]);

  if (clientError) {
    return <EmptyState title="Couldn't load this client" description={clientError} />;
  }

  if (!client) {
    notFound();
  }

  const uploadAction = uploadFile.bind(null, clientId);

  return (
    <>
      <div className="border-b border-border px-4 py-3">
        <p className="font-medium">{client.company_name}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {filesError ? (
          <EmptyState title="Couldn't load files" description={filesError} />
        ) : (
          <FileList
            files={files}
            currentUserId={user?.id ?? ""}
            canDeleteAny={false}
            clientId={client.id}
          />
        )}
      </div>

      <div className="border-t border-border p-3">
        <FileUploadForm action={uploadAction} />
      </div>
    </>
  );
}
