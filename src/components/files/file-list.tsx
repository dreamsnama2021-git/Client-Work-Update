"use client";

import {
  File as FileIcon,
  FileArchive,
  FileText,
  FileVideo,
  Image as ImageIcon,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { formatFileSize } from "@/lib/format-file-size";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { ClientFileWithUploader } from "@/types/file";
import { DeleteFileDialog } from "./delete-file-dialog";

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return FileIcon;
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.includes("zip") || mimeType.includes("compressed")) {
    return FileArchive;
  }
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) {
    return FileText;
  }
  return FileIcon;
}

export function FileList({
  files,
  currentUserId,
  canDeleteAny,
  clientId,
}: {
  files: ClientFileWithUploader[];
  currentUserId: string;
  canDeleteAny: boolean;
  clientId: string;
}) {
  if (files.length === 0) {
    return (
      <EmptyState
        icon={FileIcon}
        title="No files yet"
        description="Upload the first file to share it here."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {files.map((file) => {
        const Icon = getFileIcon(file.mime_type);
        const uploaderName =
          file.uploader?.full_name || file.uploader?.email || "Unknown";
        const canDelete = canDeleteAny || file.uploaded_by === currentUserId;

        return (
          <li key={file.id} className="flex items-center gap-3 py-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              {file.signedUrl ? (
                <a
                  href={file.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm font-medium hover:text-primary"
                >
                  {file.name}
                </a>
              ) : (
                <p className="truncate text-sm font-medium">{file.name}</p>
              )}
              <p className="truncate text-xs text-muted-foreground">
                {formatFileSize(file.size_bytes)} &middot; {uploaderName}{" "}
                &middot; {formatRelativeTime(file.created_at)}
              </p>
            </div>
            {canDelete && (
              <DeleteFileDialog
                fileId={file.id}
                fileName={file.name}
                clientId={clientId}
                storagePath={file.storage_path}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
