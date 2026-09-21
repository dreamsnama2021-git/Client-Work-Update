import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClientFileWithUploader, FileGroup } from "@/types/file";

export const FILES_BUCKET = "project-files";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export interface ListFileGroupsResult {
  groups: FileGroup[];
  error: string | null;
}

/**
 * One row per client the current user can see (RLS scopes this the same
 * way it does for conversations), annotated with a file count and the most
 * recent upload time. Mirrors listConversations() in lib/messages/queries.ts.
 */
export async function listFileGroups(
  filters: { clientId?: string } = {},
): Promise<ListFileGroupsResult> {
  const supabase = await createSupabaseServerClient();

  let clientsQuery = supabase
    .from("clients")
    .select("id, company_name")
    .order("company_name", { ascending: true });

  if (filters.clientId) {
    clientsQuery = clientsQuery.eq("id", filters.clientId);
  }

  const [{ data: clients, error: clientsError }, { data: files, error: filesError }] =
    await Promise.all([
      clientsQuery,
      supabase
        .from("files")
        .select("client_id, created_at")
        .order("created_at", { ascending: false }),
    ]);

  if (clientsError) {
    return { groups: [], error: clientsError.message };
  }

  if (filesError) {
    return { groups: [], error: filesError.message };
  }

  const countByClient = new Map<string, number>();
  const lastUploadByClient = new Map<string, string>();
  for (const file of files ?? []) {
    countByClient.set(file.client_id, (countByClient.get(file.client_id) ?? 0) + 1);
    if (!lastUploadByClient.has(file.client_id)) {
      lastUploadByClient.set(file.client_id, file.created_at);
    }
  }

  const groups: FileGroup[] = (clients ?? []).map((client) => ({
    client,
    fileCount: countByClient.get(client.id) ?? 0,
    lastUploadedAt: lastUploadByClient.get(client.id) ?? null,
  }));

  groups.sort((a, b) => {
    if (a.lastUploadedAt && b.lastUploadedAt) {
      return (
        new Date(b.lastUploadedAt).getTime() -
        new Date(a.lastUploadedAt).getTime()
      );
    }
    if (a.lastUploadedAt) return -1;
    if (b.lastUploadedAt) return 1;
    return 0;
  });

  return { groups, error: null };
}

export interface ListFilesResult {
  files: ClientFileWithUploader[];
  error: string | null;
}

export async function listFilesForClient(
  clientId: string,
): Promise<ListFilesResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("files")
    .select("*, uploader:profiles(id, full_name, email)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    return { files: [], error: error.message };
  }

  const rows = (data ?? []) as unknown as (ClientFileWithUploader & {
    storage_path: string;
  })[];

  if (rows.length === 0) {
    return { files: [], error: null };
  }

  const { data: signedUrls } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUrls(
      rows.map((f) => f.storage_path),
      SIGNED_URL_TTL_SECONDS,
    );

  const urlByPath = new Map(
    (signedUrls ?? []).map((s) => [s.path, s.signedUrl]),
  );

  const files = rows.map((f) => ({
    ...f,
    signedUrl: urlByPath.get(f.storage_path) ?? null,
  }));

  return { files, error: null };
}
