import type { Database } from "./database.types";

export type ClientFile = Database["public"]["Tables"]["files"]["Row"];

export interface ClientFileWithUploader extends ClientFile {
  signedUrl: string | null;
  uploader: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

export interface FileGroup {
  client: { id: string; company_name: string };
  fileCount: number;
  lastUploadedAt: string | null;
}
