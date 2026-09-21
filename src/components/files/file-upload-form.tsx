"use client";

import { useActionState, useEffect, useRef } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { UploadFileActionState } from "@/lib/actions/files";

const initialState: UploadFileActionState = { error: null };

export function FileUploadForm({
  action,
}: {
  action: (
    state: UploadFileActionState,
    formData: FormData,
  ) => Promise<UploadFileActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="file"
          name="file"
          required
          className="flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
        />
        <Button type="submit" disabled={isPending}>
          <Upload className="size-4" />
          {isPending ? "Uploading…" : "Upload"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Max file size: 25MB.</p>
    </form>
  );
}
