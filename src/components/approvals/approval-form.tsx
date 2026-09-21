"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ApprovalActionState } from "@/lib/actions/approvals";

const initialState: ApprovalActionState = { error: null };

interface ApprovalFormProps {
  clients: { id: string; company_name: string }[];
  defaultClientId?: string;
  action: (
    state: ApprovalActionState,
    formData: FormData,
  ) => Promise<ApprovalActionState>;
  submitLabel: string;
  cancelHref: string;
}

export function ApprovalForm({
  clients,
  defaultClientId,
  action,
  submitLabel,
  cancelHref,
}: ApprovalFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldErrors = state.fieldErrors ?? {};
  const values = state.values;

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={values?.title}
          placeholder="Homepage hero design — v2"
          required
        />
        {fieldErrors.title && (
          <p className="text-xs text-destructive">{fieldErrors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientId">Client</Label>
        <Select
          id="clientId"
          name="clientId"
          defaultValue={values?.clientId ?? defaultClientId ?? ""}
          required
        >
          <option value="" disabled>
            Select a client
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.company_name}
            </option>
          ))}
        </Select>
        {fieldErrors.clientId && (
          <p className="text-xs text-destructive">{fieldErrors.clientId}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">What are they reviewing?</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={values?.description}
          placeholder="Add context or a link to what needs sign-off…"
          rows={4}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting…" : submitLabel}
        </Button>
        <Button variant="outline" type="button" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
