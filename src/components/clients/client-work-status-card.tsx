"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addExtraWork,
  addWorkSlot,
  deleteExtraWork,
  deleteWorkSlot,
  updateClientWebsiteStatus,
  updateExtraWork,
  updateWorkSlot,
  type WorkStatusActionState,
} from "@/lib/actions/clients";
import { adjacentMonths, formatMonthLabel } from "@/lib/month-param";
import { SLOT_CONTENT_LABELS, WEBSITE_STATUS_LABELS } from "@/types/client";
import type {
  ClientExtraWork,
  ClientService,
  ClientWorkSlot,
  SlotContentType,
  WebsiteStatus,
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

function SlotRow({
  slot,
  clientId,
  target,
}: {
  slot: ClientWorkSlot;
  clientId: string;
  target: number | null;
}) {
  const action = updateWorkSlot.bind(null, slot.id, clientId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const deleteAction = deleteWorkSlot.bind(null, slot.id, clientId);

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
            defaultValue={slot.completed_count}
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

      <div className="flex items-center gap-4">
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
  slots: ClientWorkSlot[];
}) {
  const totalCompleted = slots.reduce((sum, s) => sum + s.completed_count, 0);
  const addAction = addWorkSlot.bind(null, clientId, month, contentType);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {SLOT_CONTENT_LABELS[contentType]}
          {target !== null && (
            <span className="ml-1.5 font-normal text-muted-foreground">
              target {target}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {totalCompleted}
          {target !== null ? `/${target}` : ""} complete
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
  slots: ClientWorkSlot[];
  extraWork: ClientExtraWork[];
  website: ClientService | null;
}

export function ClientWorkStatusCard({
  clientId,
  month,
  hasSocialMedia,
  staticTarget,
  reelTarget,
  slots,
  extraWork,
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
  const totalCompleted = slots.reduce((sum, s) => sum + s.completed_count, 0);
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
              <p className="text-sm font-medium">Social Media</p>
              {totalTarget !== null && (
                <p className="text-xs text-muted-foreground">
                  Total Post: {totalCompleted}/{totalTarget}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ContentSection
                clientId={clientId}
                month={month}
                contentType="static"
                target={staticTarget}
                slots={staticSlots}
              />
              <ContentSection
                clientId={clientId}
                month={month}
                contentType="reel"
                target={reelTarget}
                slots={reelSlots}
              />
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
