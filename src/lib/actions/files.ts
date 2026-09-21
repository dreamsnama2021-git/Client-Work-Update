"use server";

import { revalidatePath } from "next/cache";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { FILES_BUCKET } from "@/lib/files/queries";
import { logActivity } from "@/lib/activity/log";
import { notifyAdmins, notifyUser } from "@/lib/notifications/create";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB, matches the bucket's own limit

export type UploadFileActionState = {
  error: string | null;
};

export async function uploadFile(
  clientId: string,
  _prevState: UploadFileActionState,
  formData: FormData,
): Promise<UploadFileActionState> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "That file is larger than the 25MB limit." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to upload files." };
  }

  const storagePath = `${clientId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(FILES_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || undefined,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: dbError } = await supabase.from("files").insert({
    client_id: clientId,
    uploaded_by: user.id,
    name: file.name,
    storage_path: storagePath,
    size_bytes: file.size,
    mime_type: file.type || null,
  });

  if (dbError) {
    await supabase.storage.from(FILES_BUCKET).remove([storagePath]);
    return { error: dbError.message };
  }

  const [{ data: uploaderProfile }, { data: clientResult }] = await Promise.all([
    supabase.from("profiles").select("role, full_name, email").eq("id", user.id).single(),
    supabase
      .from("clients")
      .select("company_name, profile_id")
      .eq("id", clientId)
      .single(),
  ]);

  const client = clientResult as unknown as {
    company_name: string;
    profile_id: string | null;
  } | null;

  await logActivity(supabase, {
    type: "file_uploaded",
    actorId: user.id,
    message: "uploaded a file for",
    target: client?.company_name ?? "a client",
  });

  const uploaderName =
    uploaderProfile?.full_name || uploaderProfile?.email || "Someone";

  if (uploaderProfile?.role === "admin") {
    if (client?.profile_id) {
      await notifyUser(supabase, {
        recipientId: client.profile_id,
        title: "New file uploaded",
        description: `${uploaderName} uploaded ${file.name}.`,
        link: `/client/files/${clientId}`,
      });
    }
  } else {
    await notifyAdmins(supabase, {
      title: "New file uploaded",
      description: `${uploaderName} uploaded ${file.name}.`,
      link: `/admin/files/${clientId}`,
    });
  }

  revalidatePath(`/admin/files/${clientId}`);
  revalidatePath(`/client/files/${clientId}`);
  revalidatePath("/admin/files");
  revalidatePath("/client/files");
  revalidatePath(`/admin/clients/${clientId}`);

  return { error: null };
}

export async function deleteFile(
  fileId: string,
  clientId: string,
  storagePath: string,
) {
  const supabase = await createSupabaseServerClient();

  const { error: dbError } = await supabase
    .from("files")
    .delete()
    .eq("id", fileId);

  if (dbError) {
    throw new Error(dbError.message);
  }

  await supabase.storage.from(FILES_BUCKET).remove([storagePath]);

  revalidatePath(`/admin/files/${clientId}`);
  revalidatePath(`/client/files/${clientId}`);
  revalidatePath("/admin/files");
  revalidatePath("/client/files");
  revalidatePath(`/admin/clients/${clientId}`);
}
