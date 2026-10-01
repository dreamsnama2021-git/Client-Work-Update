"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addReferenceNote,
  addSlotItemNote,
  approveExtraWorkAsClient,
  approvePostRevisionAsClient,
  approveReferenceAsClient,
  approveSlotAsClient,
  approveSlotItemAsClient,
  rejectPostRevisionAsClient,
  rejectReferenceAsClient,
  rejectSlotAsClient,
  rejectSlotItemAsClient,
  type WorkStatusActionState,
} from "@/lib/actions/clients";
import { adjacentMonths, formatMonthLabel } from "@/lib/month-param";
import { SLOT_CONTENT_LABELS, WEBSITE_STATUS_LABELS } from "@/types/client";
import type {
  ClientExtraWork,
  ClientReferenceWithNotes,
  ClientService,
  ClientWorkPostWithRevisions,
  ClientWorkSlotItemWithNotes,
  ClientWorkSlotWithItems,
  SlotContentType,
  WorkDisplayTemplate,
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

/** A rejected item no longer counts as complete — it moves to incomplete
 * until the admin swaps in a new link for that item number. */
function getEffectiveCompleted(slot: ClientWorkSlotWithItems) {
  const rejected = slot.items.filter((i) => i.client_rejected_at !== null).length;
  return { rejected, effective: Math.max(slot.completed_count - rejected, 0) };
}

function SlotItemReadout({ item }: { item: ClientWorkSlotItemWithNotes }) {
  const approveAction = approveSlotItemAsClient.bind(null, item.id);
  const [approveState, approveFormAction, approvePending] = useActionState(
    approveAction,
    initialState,
  );
  const rejectAction = rejectSlotItemAsClient.bind(null, item.id);
  const [rejectState, rejectFormAction, rejectPending] = useActionState(
    rejectAction,
    initialState,
  );
  const approvedStamp = formatStamp(item.client_approved_at);
  const rejectedStamp = formatStamp(item.client_rejected_at);
  const isPending = approvePending || rejectPending;

  return (
    <div className="space-y-1 rounded border border-border/60 p-2">
      <div className="flex items-center justify-between gap-2">
        <a
          href={item.content_link ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="truncate font-medium text-primary hover:underline"
        >
          Item {item.item_number}
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
                className="size-6"
                aria-label="Approve"
              >
                <Check className="size-3.5" />
              </Button>
            </form>
            <form action={rejectFormAction}>
              <Button
                type="submit"
                variant="outline"
                size="icon"
                disabled={isPending}
                className="size-6 text-destructive hover:text-destructive"
                aria-label="Reject"
              >
                <X className="size-3.5" />
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
          notes={item.notes}
          addNoteAction={addSlotItemNote.bind(null, item.id)}
        />
      )}
    </div>
  );
}

function SlotReadout({ slot }: { slot: ClientWorkSlotWithItems }) {
  const approveAction = approveSlotAsClient.bind(null, slot.id);
  const [approveState, approveFormAction, approvePending] = useActionState(
    approveAction,
    initialState,
  );
  const rejectAction = rejectSlotAsClient.bind(null, slot.id);
  const [rejectState, rejectFormAction, rejectPending] = useActionState(
    rejectAction,
    initialState,
  );
  const teamStamp = formatStamp(slot.sent_to_client_at);
  const approvedStamp = formatStamp(slot.client_approved_at);
  const rejectedStamp = formatStamp(slot.client_rejected_at);
  const isPending = approvePending || rejectPending;
  const linkedItems = slot.items.filter((i) => i.content_link);

  return (
    <div className="space-y-2 rounded-md border border-border p-2.5 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Slot {slot.slot_number}</span>
        <span className="font-medium">{slot.completed_count} done</span>
      </div>
      {slot.ready_at && (
        <p className="text-muted-foreground">
          Ready {STAMP_LABEL.format(new Date(slot.ready_at))}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">
          Team{teamStamp ? ` · ${teamStamp}` : " — not sent yet"}
        </span>
      </div>

      {linkedItems.length > 0 ? (
        <div className="space-y-1.5">
          {linkedItems.map((item) => (
            <SlotItemReadout key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {approvedStamp ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Check className="size-3.5" />
              {approvedStamp}
            </span>
          ) : rejectedStamp ? (
            <span className="flex items-center gap-1 text-destructive">
              <X className="size-3.5" />
              {rejectedStamp}
            </span>
          ) : teamStamp ? (
            <div className="flex gap-2">
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
          ) : (
            <span className="text-muted-foreground">
              Waiting for the team to share this before you can review.
            </span>
          )}
          {(approveState.error || rejectState.error) && (
            <p className="text-destructive">{approveState.error || rejectState.error}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ContentReadout({
  contentType,
  target,
  slots,
}: {
  contentType: SlotContentType;
  target: number | null;
  slots: ClientWorkSlotWithItems[];
}) {
  const totals = slots.reduce(
    (acc, s) => {
      const { rejected, effective } = getEffectiveCompleted(s);
      acc.completed += effective;
      acc.incomplete += rejected;
      return acc;
    },
    { completed: 0, incomplete: 0 },
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{SLOT_CONTENT_LABELS[contentType]} Post</p>
        <p className="text-xs text-muted-foreground">
          {totals.completed}
          {target !== null ? `/${target}` : ""} complete
        </p>
      </div>
      {slots.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing logged yet this month.</p>
      ) : (
        <div className="space-y-2">
          {slots.map((slot) => (
            <SlotReadout key={slot.id} slot={slot} />
          ))}
        </div>
      )}
    </div>
  );
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
    </div>
  );
}

function PostContentReadout({
  contentType,
  target,
  posts,
}: {
  contentType: SlotContentType;
  target: number | null;
  posts: ClientWorkPostWithRevisions[];
}) {
  const completed = posts.filter(
    (p) => p.revisions[p.revisions.length - 1]?.client_approved_at != null,
  ).length;

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
        <p className="text-xs text-muted-foreground">Nothing logged yet this month.</p>
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
  workDisplayTemplate: WorkDisplayTemplate;
  slots: ClientWorkSlotWithItems[];
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
  workDisplayTemplate,
  slots,
  posts,
  extraWork,
  references,
  website,
}: ClientMonthlyWorkViewProps) {
  if (!hasSocialMedia && !website) {
    return null;
  }

  const { prev, next } = adjacentMonths(month);
  const staticSlots = slots.filter((s) => s.content_type === "static");
  const reelSlots = slots.filter((s) => s.content_type === "reel");
  const staticPosts = posts.filter((p) => p.content_type === "static");
  const reelPosts = posts.filter((p) => p.content_type === "reel");
  const staticReferences = references.filter((r) => r.content_type === "static");
  const reelReferences = references.filter((r) => r.content_type === "reel");
  const usingPosts = workDisplayTemplate === "posts";
  const totalTarget =
    staticTarget !== null || reelTarget !== null
      ? (staticTarget ?? 0) + (reelTarget ?? 0)
      : null;
  const totals = usingPosts
    ? {
        completed: posts.filter(
          (p) => p.revisions[p.revisions.length - 1]?.client_approved_at != null,
        ).length,
        incomplete: 0,
      }
    : slots.reduce(
        (acc, s) => {
          const { rejected, effective } = getEffectiveCompleted(s);
          acc.completed += effective;
          acc.incomplete += rejected;
          return acc;
        },
        { completed: 0, incomplete: 0 },
      );

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
                  Total Post: {totals.completed}/{totalTarget}
                </p>
              )}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReferenceReadoutSection contentType="static" references={staticReferences} />
                {usingPosts ? (
                  <PostContentReadout contentType="static" target={staticTarget} posts={staticPosts} />
                ) : (
                  <ContentReadout contentType="static" target={staticTarget} slots={staticSlots} />
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReferenceReadoutSection contentType="reel" references={reelReferences} />
                {usingPosts ? (
                  <PostContentReadout contentType="reel" target={reelTarget} posts={reelPosts} />
                ) : (
                  <ContentReadout contentType="reel" target={reelTarget} slots={reelSlots} />
                )}
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
