"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addPostRevisionNote,
  addReferenceNote,
  approveExtraWorkAsClient,
  approvePostRevisionAsClient,
  approveReferenceAsClient,
  rejectPostRevisionAsClient,
  rejectReferenceAsClient,
  type WorkStatusActionState,
} from "@/lib/actions/clients";
import { adjacentMonths, formatMonthLabel } from "@/lib/month-param";
import { SLOT_CONTENT_LABELS, WEBSITE_STATUS_LABELS } from "@/types/client";
import type { LegacyCompleted } from "@/lib/clients/queries";
import type {
  ClientExtraWork,
  ClientReferenceWithNotes,
  ClientService,
  ClientWorkPostWithRevisions,
  SlotContentType,
} from "@/types/client";

const initialState: WorkStatusActionState = { error: null };

const STAMP_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatStamp(iso: string | null) {
  return iso ? STAMP_LABEL.format(new Date(iso)) : null;
}

function PostRevisionReadout({ post }: { post: ClientWorkPostWithRevisions }) {
  const latestRevision = post.revisions[post.revisions.length - 1] ?? null;
  const approveAction = approvePostRevisionAsClient.bind(null, latestRevision?.id ?? "");
  const [approveState, approveFormAction, approvePending] = useActionState(
    approveAction,
    initialState,
  );
  const rejectAction = rejectPostRevisionAsClient.bind(null, latestRevision?.id ?? "");
  const [rejectState, rejectFormAction, rejectPending] = useActionState(
    rejectAction,
    initialState,
  );

  if (!latestRevision) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border p-2.5 text-xs">
        <span className="font-semibold">Post {post.post_number}</span>
        <span className="text-muted-foreground">Waiting for the team to share a link.</span>
      </div>
    );
  }

  const approvedStamp = formatStamp(latestRevision.client_approved_at);
  const rejectedStamp = formatStamp(latestRevision.client_rejected_at);
  const isPending = approvePending || rejectPending;

  return (
    <div className="space-y-1 rounded-md border border-border p-2.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-semibold">Post {post.post_number}</span>
          <a
            href={latestRevision.content_link}
            target="_blank"
            rel="noreferrer"
            className="truncate text-primary hover:underline"
          >
            View
          </a>
        </div>
        {approvedStamp ? (
          <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
            <Check className="size-3.5" />
            {approvedStamp}
          </span>
        ) : rejectedStamp ? (
          <span className="flex shrink-0 items-center gap-1 text-destructive">
            <X className="size-3.5" />
            {rejectedStamp}
          </span>
        ) : (
          <div className="flex shrink-0 gap-1.5">
            <form action={approveFormAction}>
              <Button
                type="submit"
                size="icon"
                disabled={isPending}
                className="size-7"
                aria-label="Approve"
              >
                <Check className="size-4" />
              </Button>
            </form>
            <form action={rejectFormAction}>
              <Button
                type="submit"
                variant="outline"
                size="icon"
                disabled={isPending}
                className="size-7 text-destructive hover:text-destructive"
                aria-label="Reject"
              >
                <X className="size-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
      {(approveState.error || rejectState.error) && (
        <p className="text-destructive">{approveState.error || rejectState.error}</p>
      )}
      {post.revisions.slice(0, -1).some((r) => r.notes.length > 0) && (
        <div className="space-y-1.5 border-t border-border/60 pt-1.5">
          {post.revisions.slice(0, -1).flatMap((r) =>
            r.notes.map((n) => (
              <div key={n.id} className="space-y-0.5 rounded bg-muted/40 p-1.5">
                <p className="font-medium text-muted-foreground">Revision {r.revision_number}</p>
                <p>{n.note}</p>
                {n.link && (
                  <a
                    href={n.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    View your link
                  </a>
                )}
                <p className="text-muted-foreground">{formatStamp(n.created_at)}</p>
              </div>
            )),
          )}
        </div>
      )}
      {rejectedStamp && (
        <ChangeRequestNotes
          notes={latestRevision.notes}
          addNoteAction={addPostRevisionNote.bind(null, latestRevision.id)}
        />
      )}
    </div>
  );
}

function PostContentReadout({
  contentType,
  target,
  posts,
  legacyCompleted,
}: {
  contentType: SlotContentType;
  target: number | null;
  posts: ClientWorkPostWithRevisions[];
  legacyCompleted: number;
}) {
  const completed = posts.filter(
    (p) => p.revisions[p.revisions.length - 1]?.client_approved_at != null,
  ).length + legacyCompleted;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{SLOT_CONTENT_LABELS[contentType]} Post</p>
        <p className="text-xs text-muted-foreground">
          {completed}
          {target !== null ? `/${target}` : ""} complete
        </p>
      </div>
      {posts.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {legacyCompleted > 0
            ? `${legacyCompleted} logged before per-post tracking.`
            : "Nothing logged yet this month."}
        </p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <PostRevisionReadout key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ChangeNote {
  id: string;
  note: string;
  link: string | null;
  created_at: string;
}

/** A change request a client can leave once they've rejected something —
 * a free-text note plus an optional link. The first one shows the form
 * right away; once any note exists, adding another requires the "+". Shared
 * by rejected references and rejected slot items, which differ only in
 * which server action adds the note. */
function ChangeRequestNotes({
  notes,
  addNoteAction,
}: {
  notes: ChangeNote[];
  addNoteAction: (
    prevState: WorkStatusActionState,
    formData: FormData,
  ) => Promise<WorkStatusActionState>;
}) {
  const [adding, setAdding] = useState(notes.length === 0);
  const prevNotesLength = useRef(notes.length);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(addNoteAction, initialState);

  useEffect(() => {
    if (notes.length > prevNotesLength.current) {
      setAdding(false);
      formRef.current?.reset();
    }
    prevNotesLength.current = notes.length;
  }, [notes.length]);

  return (
    <div className="space-y-1.5 border-t border-border/60 pt-1.5">
      {notes.length > 0 && (
        <div className="space-y-1.5">
          {notes.map((n) => (
            <div key={n.id} className="space-y-0.5 rounded bg-muted/40 p-1.5">
              <p>{n.note}</p>
              {n.link && (
                <a
                  href={n.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  View your link
                </a>
              )}
              <p className="text-muted-foreground">{formatStamp(n.created_at)}</p>
            </div>
          ))}
        </div>
      )}
      {adding ? (
        <form ref={formRef} action={formAction} className="space-y-1.5">
          <Textarea
            name="note"
            placeholder="What changes would you like?"
            rows={2}
            className="text-xs"
          />
          <Input
            name="link"
            type="url"
            placeholder="Optional link (e.g. an example)…"
            className="h-7 text-xs"
          />
          <div className="flex items-center gap-1.5">
            <Button type="submit" size="sm" disabled={isPending} className="h-7 px-2.5 text-xs">
              {isPending ? "…" : "Submit"}
            </Button>
            {notes.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
            )}
          </div>
          {state.error && <p className="text-destructive">{state.error}</p>}
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-3.5" /> Add changes
        </Button>
      )}
    </div>
  );
}

function ReferenceReadout({ reference }: { reference: ClientReferenceWithNotes }) {
  const approveAction = approveReferenceAsClient.bind(null, reference.id);
  const [approveState, approveFormAction, approvePending] = useActionState(
    approveAction,
    initialState,
  );
  const rejectAction = rejectReferenceAsClient.bind(null, reference.id);
  const [rejectState, rejectFormAction, rejectPending] = useActionState(
    rejectAction,
    initialState,
  );
  const teamStamp = formatStamp(reference.link_added_at);
  const approvedStamp = formatStamp(reference.client_approved_at);
  const rejectedStamp = formatStamp(reference.client_rejected_at);
  const isPending = approvePending || rejectPending;

  if (!reference.content_link) return null;

  return (
    <div className="space-y-1 rounded-md border border-border p-2.5 text-xs">
      {teamStamp && <p className="text-muted-foreground">Team · {teamStamp}</p>}
      <div className="flex items-center justify-between gap-2">
        <a
          href={reference.content_link}
          target="_blank"
          rel="noreferrer"
          className="truncate font-medium text-primary hover:underline"
        >
          View reference
        </a>
        {approvedStamp ? (
          <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
            <Check className="size-3.5" />
            {approvedStamp}
          </span>
        ) : rejectedStamp ? (
          <span className="flex shrink-0 items-center gap-1 text-destructive">
            <X className="size-3.5" />
            {rejectedStamp}
          </span>
        ) : (
          <div className="flex shrink-0 gap-1.5">
            <form action={approveFormAction}>
              <Button
                type="submit"
                size="icon"
                disabled={isPending}
                className="size-7"
                aria-label="Approve"
              >
                <Check className="size-4" />
              </Button>
            </form>
            <form action={rejectFormAction}>
              <Button
                type="submit"
                variant="outline"
                size="icon"
                disabled={isPending}
                className="size-7 text-destructive hover:text-destructive"
                aria-label="Reject"
              >
                <X className="size-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
      {(approveState.error || rejectState.error) && (
        <p className="text-destructive">{approveState.error || rejectState.error}</p>
      )}
      {rejectedStamp && (
        <ChangeRequestNotes
          notes={reference.notes}
          addNoteAction={addReferenceNote.bind(null, reference.id)}
        />
      )}
    </div>
  );
}

function ReferenceReadoutSection({
  contentType,
  references,
}: {
  contentType: SlotContentType;
  references: ClientReferenceWithNotes[];
}) {
  const visible = references.filter((r) => r.content_link);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{SLOT_CONTENT_LABELS[contentType]} Reference</p>
      {visible.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing shared yet this month.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((reference) => (
            <ReferenceReadout key={reference.id} reference={reference} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExtraWorkReadout({ item }: { item: ClientExtraWork }) {
  const approveAction = approveExtraWorkAsClient.bind(null, item.id);
  const [state, formAction, isPending] = useActionState(approveAction, initialState);
  const teamStamp = formatStamp(item.sent_to_client_at);
  const clientStamp = formatStamp(item.client_approved_at);
  const sentByTeam = item.sent_to_client_at !== null;

  return (
    <div className="space-y-2 rounded-md border border-border p-2.5 text-xs">
      <p>{item.description || "—"}</p>
      <p className="text-muted-foreground">
        Team{teamStamp ? ` · ${teamStamp}` : " — not sent yet"}
      </p>
      <div className="space-y-1">
        {clientStamp ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Check className="size-3.5" />
            {clientStamp}
          </span>
        ) : sentByTeam ? (
          <form action={formAction}>
            <Button
              type="submit"
              size="icon"
              disabled={isPending}
              className="size-7"
              aria-label="Approve"
            >
              <Check className="size-4" />
            </Button>
          </form>
        ) : (
          <span className="text-muted-foreground">
            Waiting for the team to share this before you can approve.
          </span>
        )}
        {state.error && <p className="text-destructive">{state.error}</p>}
      </div>
    </div>
  );
}

interface ClientMonthlyWorkViewProps {
  basePath: string;
  month: string;
  hasSocialMedia: boolean;
  staticTarget: number | null;
  reelTarget: number | null;
  legacyCompleted: LegacyCompleted;
  posts: ClientWorkPostWithRevisions[];
  extraWork: ClientExtraWork[];
  references: ClientReferenceWithNotes[];
  website: ClientService | null;
}

export function ClientMonthlyWorkView({
  basePath,
  month,
  hasSocialMedia,
  staticTarget,
  reelTarget,
  legacyCompleted,
  posts,
  extraWork,
  references,
  website,
}: ClientMonthlyWorkViewProps) {
  if (!hasSocialMedia && !website) {
    return null;
  }

  const { prev, next } = adjacentMonths(month);
  const staticPosts = posts.filter((p) => p.content_type === "static");
  const reelPosts = posts.filter((p) => p.content_type === "reel");
  const staticReferences = references.filter((r) => r.content_type === "static");
  const reelReferences = references.filter((r) => r.content_type === "reel");
  const totalTarget =
    staticTarget !== null || reelTarget !== null
      ? (staticTarget ?? 0) + (reelTarget ?? 0)
      : null;
  const completed = posts.filter(
    (p) => p.revisions[p.revisions.length - 1]?.client_approved_at != null,
  ).length + legacyCompleted.static + legacyCompleted.reel;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Your Work</CardTitle>
        {hasSocialMedia && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild className="size-8">
              <Link href={`${basePath}?month=${prev}`}>
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
            <p className="w-32 text-center text-sm font-medium">
              {formatMonthLabel(month)}
            </p>
            <Button variant="outline" size="icon" asChild className="size-8">
              <Link href={`${basePath}?month=${next}`}>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {hasSocialMedia && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Social Media</p>
              {totalTarget !== null && (
                <p className="text-xs text-muted-foreground">
                  Total Post: {completed}/{totalTarget}
                </p>
              )}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReferenceReadoutSection contentType="static" references={staticReferences} />
                <PostContentReadout
                  contentType="static"
                  target={staticTarget}
                  posts={staticPosts}
                  legacyCompleted={legacyCompleted.static}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReferenceReadoutSection contentType="reel" references={reelReferences} />
                <PostContentReadout
                  contentType="reel"
                  target={reelTarget}
                  posts={reelPosts}
                  legacyCompleted={legacyCompleted.reel}
                />
              </div>
            </div>
          </div>
        )}

        {extraWork.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Extra Work</p>
            <div className="space-y-2">
              {extraWork.map((item) => (
                <ExtraWorkReadout key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {website?.site_status && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Website</p>
            <span className="inline-flex items-center rounded-md border border-primary bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {WEBSITE_STATUS_LABELS[website.site_status]}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
