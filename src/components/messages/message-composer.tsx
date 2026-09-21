"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MessageActionState } from "@/lib/actions/messages";

const initialState: MessageActionState = { error: null };

export function MessageComposer({
  action,
}: {
  action: (
    state: MessageActionState,
    formData: FormData,
  ) => Promise<MessageActionState>;
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
      <div className="flex items-end gap-2">
        <Textarea
          name="body"
          placeholder="Write a message…"
          rows={2}
          defaultValue={state.values?.body}
          required
          className="resize-none"
        />
        <Button type="submit" size="icon" disabled={isPending} aria-label="Send message">
          <Send className="size-4" />
        </Button>
      </div>
    </form>
  );
}
