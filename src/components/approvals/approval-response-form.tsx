"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { RespondActionState } from "@/lib/actions/approvals";

const initialState: RespondActionState = { error: null };

export function ApprovalResponseForm({
  action,
}: {
  action: (
    state: RespondActionState,
    formData: FormData,
  ) => Promise<RespondActionState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  return (
    <div className="space-y-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {showRevisionForm ? (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="action" value="request_revision" />
          <Textarea
            name="feedback"
            placeholder="What needs to change before you can approve this?"
            rows={4}
            autoFocus
            required
          />
          <div className="flex items-center gap-3">
            <Button type="submit" variant="outline" disabled={isPending}>
              {isPending ? "Sending…" : "Send revision request"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowRevisionForm(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <form action={formAction}>
            <input type="hidden" name="action" value="approve" />
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              <CheckCircle2 className="size-4" />
              Approve
            </Button>
          </form>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setShowRevisionForm(true)}
          >
            <RotateCcw className="size-4" />
            Request Revision
          </Button>
        </div>
      )}
    </div>
  );
}
