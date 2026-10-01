"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addExtraWork,
  addPostRevision,
  addReference,
  addWorkPost,
  addWorkSlot,
  deleteExtraWork,
  deleteReference,
  deleteWorkPost,
  deleteWorkSlot,
  updateClientWebsiteStatus,
  updateExtraWork,
  updateReference,
  updateWorkDisplayTemplate,
  updateWorkSlot,
  type WorkStatusActionState,
} from "@/lib/actions/clients";
import { adjacentMonths, formatMonthLabel } from "@/lib/month-param";
import { SLOT_CONTENT_LABELS, WEBSITE_STATUS_LABELS } from "@/types/client";
import type {
  ClientExtraWork,
  ClientReferenceWithNotes,
  ClientService,
  ClientWorkPostWithRevisions,
  ClientWorkSlotWithItems,
  SlotContentType,
  WebsiteStatus,
  WorkDisplayTemplate,
} from "@/types/client";

const initialState: WorkStatusActionState = { error: null };
const WEBSITE_STATUSES: WebsiteStatus[] = [
  "live_with_maintenance",
  "live_without_maintenance",
  "in_making",
  "maintenance",
];

const STAMP_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A rejected item no longer counts as complete — it moves to incomplete
 * until the admin swaps in a new link for that item number. */
function getEffectiveCompleted(slot: ClientWorkSlotWithItems) {
  const rejected = slot.items.filter((i) => i.client_rejected_at !== null).length;
  return { rejected, effective: Math.max(slot.completed_count - rejected, 0) };
}

function ApprovalTick({
  name,
  label,
  stampedAt,
}: {
  name: string;
  label: string;
  stampedAt: string | null;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <input
        type="checkbox"
        name={name}
        defaultChecked={stampedAt !== null}
        className="accent-primary"
      />
      {label}
      {stampedAt && (
        <span className="text-muted-foreground">
          · {STAMP_LABEL.format(new Date(stampedAt))}
        </span>
      )}
    </label>
  );
}

/** A link input with an eye-icon button that opens its current value in a
 * new tab, so the admin can check a pasted link before saving. Uses a ref
 * instead of controlled state so it stays a plain uncontrolled form field. */
function LinkFieldWithPreview({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Input
        ref={inputRef}
        name={name}
        type="url"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-7 flex-1 text-xs"
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-7 shrink-0"
        aria-label="Preview link"
        onClick={() => {
          const url = inputRef.current?.value.trim();
          if (url) window.open(url, "_blank", "noopener,noreferrer");
        }}
      >
        <Eye className="size-3.5" />
      </Button>
    </>
  );
}

function SlotRow({
  slot,
  clientId,
  target,
}: {
  slot: ClientWorkSlotWithItems;
  clientId: string;
  target: number | null;
}) {
  const action = updateWorkSlot.bind(null, slot.id, clientId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const deleteAction = deleteWorkSlot.bind(null, slot.id, clientId);
  const [count, setCount] = useState(slot.completed_count);
  const itemsByNumber = new Map(slot.items.map((i) => [i.item_number, i]));
  const rejectedCount = slot.items.filter((i) => i.client_rejected_at !== null).length;

  return (
    <form action={formAction} className="space-y-2.5 rounded-md border border-border p-3">
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">Slot {slot.slot_number}</span>
        <div className="flex items-center gap-1.5">
          <Input
            name="completed_count"
            type="number"
            min={0}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 0)}
            className="h-7 w-16 text-xs"
          />
          {target !== null && (
            <span className="text-xs text-muted-foreground">/ {target}</span>
          )}
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={isPending}
            className="h-7 px-2 text-xs"
          >
            {isPending ? "…" : "Save"}
          </Button>
          <Button
            type="submit"
            formAction={deleteAction}
            size="icon"
            variant="ghost"
            className="size-7 text-destructive hover:text-destructive"
            aria-label="Delete slot"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[11px] font-normal text-muted-foreground">Ready</Label>
        <Input
          name="ready_at"
          type="datetime-local"
          defaultValue={toDatetimeLocal(slot.ready_at)}
          className="h-7 text-xs"
        />
      </div>

      {count > 0 && (
        <div className="space-y-1.5">
          <Label className="text-[11px] font-normal text-muted-foreground">
            Links ({count} {count === 1 ? "item" : "items"} to review)
          </Label>
          <div className="space-y-1.5">
            {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
              const item = itemsByNumber.get(n);
              return (
                <div key={n} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 shrink-0 text-[11px] text-muted-foreground">{n}.</span>
                    <LinkFieldWithPreview
                      name={`item_link_${n}`}
                      defaultValue={item?.content_link ?? ""}
                      placeholder="https://…"
                    />
                    {item?.client_approved_at && (
                      <span className="shrink-0 text-[11px] text-success">
                        Approved · {STAMP_LABEL.format(new Date(item.client_approved_at))}
                      </span>
                    )}
                    {item?.client_rejected_at && (
                      <span className="shrink-0 text-[11px] text-destructive">
                        Rejected · {STAMP_LABEL.format(new Date(item.client_rejected_at))}
                      </span>
                    )}
                  </div>
                  {item && item.notes.length > 0 && (
                    <div className="ml-5 space-y-1 rounded-md border border-dashed border-border p-2">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        Changes requested
                      </p>
                      {item.notes.map((note) => (
                        <div key={note.id} className="space-y-0.5 text-[11px]">
                          <p>{note.note}</p>
                          {note.link && (
                            <a
                              href={note.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              View client&apos;s link
                            </a>
                          )}
                          <p className="text-muted-foreground">
                            {STAMP_LABEL.format(new Date(note.created_at))}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <span className="text-[11px] text-muted-foreground">Approval</span>
        <ApprovalTick
          name="team_ticked"
          label="Team"
          stampedAt={slot.sent_to_client_at}
        />
        <ApprovalTick
          name="client_ticked"
          label="Client"
          stampedAt={slot.client_approved_at}
        />
        {slot.client_rejected_at && (
          <span className="text-[11px] text-destructive">
            Rejected · {STAMP_LABEL.format(new Date(slot.client_rejected_at))}
          </span>
        )}
        {rejectedCount > 0 && !slot.client_approved_at && (
          <span className="text-[11px] text-destructive">
            {rejectedCount} item{rejectedCount === 1 ? "" : "s"} rejected
          </span>
        )}
      </div>
    </form>
  );
}

function ContentSection({
  clientId,
  month,
  contentType,
  target,
  slots,
}: {
  clientId: string;
  month: string;
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
  const addAction = addWorkSlot.bind(null, clientId, month, contentType);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {SLOT_CONTENT_LABELS[contentType]} Post
          {target !== null && (
            <span className="ml-1.5 font-normal text-muted-foreground">
              target {target}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {totals.completed}
          {target !== null ? `/${target}` : ""} complete
          {totals.incomplete > 0 && (
            <span className="text-destructive">
              {" "}
              · {totals.incomplete} incomplete
            </span>
          )}
        </p>
      </div>

      <div className="space-y-2">
        {slots.map((slot) => (
          <SlotRow key={slot.id} slot={slot} clientId={clientId} target={target} />
        ))}
      </div>

      <form action={addAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs font-medium text-primary transition-colors hover:bg-accent"
        >
          <Plus className="size-3.5" /> Add Slot
        </button>
      </form>
    </div>
  );
}

function TemplateToggle({
  clientId,
  template,
}: {
  clientId: string;
  template: WorkDisplayTemplate;
}) {
  const setSlots = updateWorkDisplayTemplate.bind(null, clientId, "slots");
  const setPosts = updateWorkDisplayTemplate.bind(null, clientId, "posts");

  return (
    <div className="flex gap-1 rounded-md border border-border p-0.5 text-[11px]">
      <form action={setSlots}>
        <button
          type="submit"
          className={
            template === "slots"
              ? "rounded-sm bg-accent px-2 py-1 font-medium"
              : "px-2 py-1 text-muted-foreground"
          }
        >
          Slots
        </button>
      </form>
      <form action={setPosts}>
        <button
          type="submit"
          className={
            template === "posts"
              ? "rounded-sm bg-accent px-2 py-1 font-medium"
              : "px-2 py-1 text-muted-foreground"
          }
        >
          Posts
        </button>
      </form>
    </div>
  );
}

function PostRow({
  post,
  clientId,
}: {
  post: ClientWorkPostWithRevisions;
  clientId: string;
}) {
  const latestRevision = post.revisions[post.revisions.length - 1] ?? null;
  const deleteAction = deleteWorkPost.bind(null, post.id, clientId);
  const addRevisionAction = addPostRevision.bind(null, post.id, clientId);
  const [state, formAction, isPending] = useActionState(addRevisionAction, initialState);

  const isApproved = latestRevision?.client_approved_at != null;
  const isRejected = latestRevision?.client_rejected_at != null;
  const needsLink = !latestRevision || isRejected;

  return (
    <div className="space-y-2 rounded-md border border-border p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">Post {post.post_number}</span>
        <form action={deleteAction}>
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="size-7 text-destructive hover:text-destructive"
            aria-label="Delete post"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </form>
      </div>

      {latestRevision && (
        <a
          href={latestRevision.content_link}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-primary hover:underline"
        >
          Revision {latestRevision.revision_number} link
        </a>
      )}

      {isApproved && (
        <p className="text-[11px] text-success">
          Approved · {STAMP_LABEL.format(new Date(latestRevision!.client_approved_at!))}
        </p>
      )}
      {isRejected && (
        <p className="text-[11px] text-destructive">
          Rejected · {STAMP_LABEL.format(new Date(latestRevision!.client_rejected_at!))} — add a
          new link below
        </p>
      )}
      {latestRevision && !isApproved && !isRejected && (
        <p className="text-[11px] text-muted-foreground">Waiting on client review…</p>
      )}

      {needsLink && (
        <form action={formAction} className="flex items-center gap-1.5">
          <LinkFieldWithPreview
            name="content_link"
            placeholder={isRejected ? "New link after changes…" : "https://…"}
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={isPending}
            className="h-7 px-2 text-xs"
          >
            {isPending ? "…" : isRejected ? "Add New Link" : "Add Link"}
          </Button>
        </form>
      )}
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}

function PostContentSection({
  clientId,
  month,
  contentType,
  target,
  posts,
}: {
  clientId: string;
  month: string;
  contentType: SlotContentType;
  target: number | null;
  posts: ClientWorkPostWithRevisions[];
}) {
  const completed = posts.filter(
    (p) => p.revisions[p.revisions.length - 1]?.client_approved_at != null,
  ).length;
  const addAction = addWorkPost.bind(null, clientId, month, contentType);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {SLOT_CONTENT_LABELS[contentType]} Post
          {target !== null && (
            <span className="ml-1.5 font-normal text-muted-foreground">
              target {target}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {completed}
          {target !== null ? `/${target}` : ""} complete
        </p>
      </div>

      <div className="space-y-2">
        {posts.map((post) => (
          <PostRow key={post.id} post={post} clientId={clientId} />
        ))}
      </div>

      <form action={addAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs font-medium text-primary transition-colors hover:bg-accent"
        >
          <Plus className="size-3.5" /> Add Post
        </button>
      </form>
    </div>
  );
}

function ReferenceRow({
  reference,
  clientId,
}: {
  reference: ClientReferenceWithNotes;
  clientId: string;
}) {
  const action = updateReference.bind(null, reference.id, clientId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const deleteAction = deleteReference.bind(null, reference.id, clientId);

  return (
    <form action={formAction} className="space-y-1.5 rounded-md border border-border p-3">
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <div className="flex items-center gap-1.5">
        <LinkFieldWithPreview
          name="content_link"
          defaultValue={reference.content_link ?? ""}
          placeholder="https://…"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={isPending}
          className="h-7 px-2 text-xs"
        >
          {isPending ? "…" : "Save"}
        </Button>
        <Button
          type="submit"
          formAction={deleteAction}
          size="icon"
          variant="ghost"
          className="size-7 text-destructive hover:text-destructive"
          aria-label="Delete reference"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {reference.link_added_at && (
        <p className="text-[11px] text-muted-foreground">
          Team · {STAMP_LABEL.format(new Date(reference.link_added_at))}
        </p>
      )}
      {reference.client_approved_at && (
        <p className="text-[11px] text-success">
          Approved · {STAMP_LABEL.format(new Date(reference.client_approved_at))}
        </p>
      )}
      {reference.client_rejected_at && (
        <p className="text-[11px] text-destructive">
          Rejected · {STAMP_LABEL.format(new Date(reference.client_rejected_at))}
        </p>
      )}
      {reference.notes.length > 0 && (
        <div className="space-y-1 rounded-md border border-dashed border-border p-2">
          <p className="text-[11px] font-medium text-muted-foreground">Changes requested</p>
          {reference.notes.map((n) => (
            <div key={n.id} className="space-y-0.5 text-[11px]">
              <p>{n.note}</p>
              {n.link && (
                <a
                  href={n.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  View client&apos;s link
                </a>
              )}
              <p className="text-muted-foreground">
                {STAMP_LABEL.format(new Date(n.created_at))}
              </p>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}

function ReferenceSection({
  clientId,
  month,
  contentType,
  references,
}: {
  clientId: string;
  month: string;
  contentType: SlotContentType;
  references: ClientReferenceWithNotes[];
}) {
  const addAction = addReference.bind(null, clientId, month, contentType);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{SLOT_CONTENT_LABELS[contentType]} Reference</p>
      <p className="text-xs text-muted-foreground">
        Links shared for feedback — the client can approve or reject each one.
      </p>

      {references.length > 0 && (
        <div className="space-y-2">
          {references.map((reference) => (
            <ReferenceRow key={reference.id} reference={reference} clientId={clientId} />
          ))}
        </div>
      )}

      <form action={addAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs font-medium text-primary transition-colors hover:bg-accent"
        >
          <Plus className="size-3.5" /> Add Reference
        </button>
      </form>
    </div>
  );
}

function ExtraWorkRow({
  item,
  clientId,
}: {
  item: ClientExtraWork;
  clientId: string;
}) {
  const action = updateExtraWork.bind(null, item.id, clientId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const deleteAction = deleteExtraWork.bind(null, item.id, clientId);

  return (
    <form action={formAction} className="space-y-2.5 rounded-md border border-border p-3">
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}

      <Textarea
        name="description"
        defaultValue={item.description}
        placeholder="What extra work did the client ask for?"
        rows={2}
        className="text-xs"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-muted-foreground">Approval</span>
          <ApprovalTick
            name="team_ticked"
            label="Team"
            stampedAt={item.sent_to_client_at}
          />
          <ApprovalTick
            name="client_ticked"
            label="Client"
            stampedAt={item.client_approved_at}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={isPending}
            className="h-7 px-2 text-xs"
          >
            {isPending ? "…" : "Save"}
          </Button>
          <Button
            type="submit"
            formAction={deleteAction}
            size="icon"
            variant="ghost"
            className="size-7 text-destructive hover:text-destructive"
            aria-label="Delete extra work"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </form>
  );
}

function ExtraWorkSection({
  clientId,
  month,
  items,
}: {
  clientId: string;
  month: string;
  items: ClientExtraWork[];
}) {
  const addAction = addExtraWork.bind(null, clientId, month);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Extra Work</p>
      <p className="text-xs text-muted-foreground">
        Anything the client asked for outside their regular monthly scope.
      </p>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <ExtraWorkRow key={item.id} item={item} clientId={clientId} />
          ))}
        </div>
      )}

      <form action={addAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs font-medium text-primary transition-colors hover:bg-accent"
        >
          <Plus className="size-3.5" /> Add Extra Work
        </button>
      </form>
    </div>
  );
}

interface ClientWorkStatusCardProps {
  clientId: string;
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

export function ClientWorkStatusCard({
  clientId,
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
}: ClientWorkStatusCardProps) {
  const websiteAction = updateClientWebsiteStatus.bind(null, clientId);
  const [websiteState, websiteFormAction, websitePending] = useActionState(
    websiteAction,
    initialState,
  );

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
  const totalTarget =
    staticTarget !== null || reelTarget !== null
      ? (staticTarget ?? 0) + (reelTarget ?? 0)
      : null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Work Status</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild className="size-8">
            <Link href={`?month=${prev}`} scroll={false}>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <p className="w-32 text-center text-sm font-medium">
            {formatMonthLabel(month)}
          </p>
          <Button variant="outline" size="icon" asChild className="size-8">
            <Link href={`?month=${next}`} scroll={false}>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasSocialMedia && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Social Media</p>
                <TemplateToggle clientId={clientId} template={workDisplayTemplate} />
              </div>
              {totalTarget !== null && (
                <p className="text-xs text-muted-foreground">
                  Total Post: {totals.completed}/{totalTarget}
                  {totals.incomplete > 0 && (
                    <span className="text-destructive">
                      {" "}
                      · {totals.incomplete} incomplete
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ReferenceSection
                  clientId={clientId}
                  month={month}
                  contentType="static"
                  references={staticReferences}
                />
                {usingPosts ? (
                  <PostContentSection
                    clientId={clientId}
                    month={month}
                    contentType="static"
                    target={staticTarget}
                    posts={staticPosts}
                  />
                ) : (
                  <ContentSection
                    clientId={clientId}
                    month={month}
                    contentType="static"
                    target={staticTarget}
                    slots={staticSlots}
                  />
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ReferenceSection
                  clientId={clientId}
                  month={month}
                  contentType="reel"
                  references={reelReferences}
                />
                {usingPosts ? (
                  <PostContentSection
                    clientId={clientId}
                    month={month}
                    contentType="reel"
                    target={reelTarget}
                    posts={reelPosts}
                  />
                ) : (
                  <ContentSection
                    clientId={clientId}
                    month={month}
                    contentType="reel"
                    target={reelTarget}
                    slots={reelSlots}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <ExtraWorkSection clientId={clientId} month={month} items={extraWork} />

        {website && (
          <form action={websiteFormAction} className="space-y-2">
            {websiteState.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {websiteState.error}
              </p>
            )}
            <p className="text-sm font-medium">Website</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WEBSITE_STATUSES.map((status) => (
                <label
                  key={status}
                  className="flex cursor-pointer items-center justify-center rounded-md border border-border p-2.5 text-center text-xs font-medium transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                >
                  <input
                    type="radio"
                    name="site_status"
                    value={status}
                    defaultChecked={website.site_status === status}
                    className="sr-only"
                  />
                  {WEBSITE_STATUS_LABELS[status]}
                </label>
              ))}
            </div>
            <Button type="submit" size="sm" disabled={websitePending} variant="outline">
              {websitePending ? "Saving…" : "Save website status"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
