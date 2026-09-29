"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  approveExtraWorkAsClient,
  approveSlotAsClient,
  approveSlotItemAsClient,
  rejectSlotAsClient,
  rejectSlotItemAsClient,
  type WorkStatusActionState,
} from "@/lib/actions/clients";
import { adjacentMonths, formatMonthLabel } from "@/lib/month-param";
import { SLOT_CONTENT_LABELS, WEBSITE_STATUS_LABELS } from "@/types/client";
import type {
  ClientExtraWork,
  ClientService,
  ClientWorkSlotItem,
  ClientWorkSlotWithItems,
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

/** A rejected item no longer counts as complete — it moves to incomplete
 * until the admin swaps in a new link for that item number. */
function getEffectiveCompleted(slot: ClientWorkSlotWithItems) {
  const rejected = slot.items.filter((i) => i.client_rejected_at !== null).length;
  return { rejected, effective: Math.max(slot.completed_count - rejected, 0) };
}

function SlotItemReadout({ item }: { item: ClientWorkSlotItem }) {
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
          <span className="shrink-0 text-muted-foreground">Approved · {approvedStamp}</span>
        ) : rejectedStamp ? (
          <span className="shrink-0 text-destructive">Rejected · {rejectedStamp}</span>
        ) : (
          <div className="flex shrink-0 gap-1.5">
            <form action={approveFormAction}>
              <Button type="submit" size="sm" disabled={isPending} className="h-6 px-2 text-[11px]">
                {approvePending ? "…" : "Approve"}
              </Button>
            </form>
            <form action={rejectFormAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={isPending}
                className="h-6 px-2 text-[11px] text-destructive hover:text-destructive"
              >
                {rejectPending ? "…" : "Reject"}
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
            <span className="text-muted-foreground">Approved by you · {approvedStamp}</span>
          ) : rejectedStamp ? (
            <span className="text-destructive">Rejected by you · {rejectedStamp}</span>
          ) : teamStamp ? (
            <div className="flex gap-2">
              <form action={approveFormAction}>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="h-7 px-2.5 text-xs"
                >
                  {approvePending ? "…" : "Approve"}
                </Button>
              </form>
              <form action={rejectFormAction}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  className="h-7 px-2.5 text-xs text-destructive hover:text-destructive"
                >
                  {rejectPending ? "…" : "Reject"}
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
        <p className="text-sm font-medium">{SLOT_CONTENT_LABELS[contentType]}</p>
        <p className="text-xs text-muted-foreground">
          {totals.completed}
          {target !== null ? `/${target}` : ""} complete
          {totals.incomplete > 0 && (
            <span className="text-destructive"> · {totals.incomplete} incomplete</span>
          )}
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
          <span className="text-muted-foreground">Approved by you · {clientStamp}</span>
        ) : sentByTeam ? (
          <form action={formAction}>
            <Button type="submit" size="sm" disabled={isPending} className="h-7 px-2.5 text-xs">
              {isPending ? "…" : "Approve"}
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
  slots: ClientWorkSlotWithItems[];
  extraWork: ClientExtraWork[];
  website: ClientService | null;
}

export function ClientMonthlyWorkView({
  basePath,
  month,
  hasSocialMedia,
  staticTarget,
  reelTarget,
  slots,
  extraWork,
  website,
}: ClientMonthlyWorkViewProps) {
  if (!hasSocialMedia && !website) {
    return null;
  }

  const { prev, next } = adjacentMonths(month);
  const staticSlots = slots.filter((s) => s.content_type === "static");
  const reelSlots = slots.filter((s) => s.content_type === "reel");
  const totalTarget =
    staticTarget !== null || reelTarget !== null
      ? (staticTarget ?? 0) + (reelTarget ?? 0)
      : null;
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
                  {totals.incomplete > 0 && (
                    <span className="text-destructive"> · {totals.incomplete} incomplete</span>
                  )}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ContentReadout contentType="static" target={staticTarget} slots={staticSlots} />
              <ContentReadout contentType="reel" target={reelTarget} slots={reelSlots} />
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
