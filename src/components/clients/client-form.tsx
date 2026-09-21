"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Clapperboard, Globe as GlobeIcon, Package, Share2, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ClientActionState, ClientServiceRawValue } from "@/lib/actions/clients";
import {
  SERVICE_DETAILS_PLACEHOLDERS,
  SERVICE_LABELS,
  SERVICE_SUB_ITEMS,
  SERVICE_TYPES,
} from "@/types/client";
import type {
  Client,
  ClientService,
  ClientServiceItem,
  ServiceType,
} from "@/types/client";

const initialState: ClientActionState = { error: null };

const SERVICE_ICONS: Record<ServiceType, LucideIcon> = {
  social_media: Share2,
  website: GlobeIcon,
  production: Clapperboard,
  offline: Package,
};

interface ClientFormProps {
  client?: Client;
  initialServices?: ClientService[];
  initialServiceItems?: ClientServiceItem[];
  action: (
    state: ClientActionState,
    formData: FormData,
  ) => Promise<ClientActionState>;
  submitLabel: string;
  cancelHref: string;
}

export function ClientForm({
  client,
  initialServices = [],
  initialServiceItems = [],
  action,
  submitLabel,
  cancelHref,
}: ClientFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldErrors = state.fieldErrors ?? {};
  const values = state.values;

  const serviceDefaults: ClientServiceRawValue[] =
    state.services ??
    initialServices.map((s) => ({
      type: s.service_type,
      details: s.details ?? "",
      staticTarget: s.static_target?.toString() ?? "",
      reelTarget: s.reel_target?.toString() ?? "",
      items: initialServiceItems
        .filter((i) => i.service_type === s.service_type)
        .map((i) => i.item),
    }));
  const serviceDetailsMap = new Map(
    serviceDefaults.map((s) => [s.type, s]),
  );
  const [checkedServices, setCheckedServices] = useState<Set<ServiceType>>(
    () => new Set(serviceDefaults.map((s) => s.type)),
  );

  function toggleService(type: ServiceType, checked: boolean) {
    setCheckedServices((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(type);
      } else {
        next.delete(type);
      }
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            name="companyName"
            defaultValue={values?.companyName ?? client?.company_name}
            placeholder="Acme Inc."
            required
          />
          {fieldErrors.companyName && (
            <p className="text-xs text-destructive">{fieldErrors.companyName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={values?.status ?? client?.status ?? "active"}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactName">Contact name</Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={values?.contactName ?? client?.contact_name}
            placeholder="Jane Doe"
            required
          />
          {fieldErrors.contactName && (
            <p className="text-xs text-destructive">{fieldErrors.contactName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={values?.contactEmail ?? client?.contact_email}
            placeholder="jane@acme.com"
            required
          />
          {fieldErrors.contactEmail && (
            <p className="text-xs text-destructive">{fieldErrors.contactEmail}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={values?.phone ?? client?.phone ?? ""}
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            defaultValue={values?.website ?? client?.website ?? ""}
            placeholder="acme.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={values?.notes ?? client?.notes ?? ""}
          placeholder="Internal notes about this client…"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Services</Label>
        <p className="text-xs text-muted-foreground">
          Select what you&apos;re doing for this client, and add details for each.
        </p>
        <div className="space-y-2">
          {SERVICE_TYPES.map((type) => {
            const Icon = SERVICE_ICONS[type];
            const checked = checkedServices.has(type);
            return (
              <div key={type} className="rounded-md border border-border p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name={`service_${type}`}
                    defaultChecked={checked}
                    onChange={(e) => toggleService(type, e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <Icon className="size-4 text-muted-foreground" />
                  {SERVICE_LABELS[type]}
                </label>
                {checked && (
                  <>
                    <Textarea
                      name={`details_${type}`}
                      defaultValue={serviceDetailsMap.get(type)?.details ?? ""}
                      placeholder={SERVICE_DETAILS_PLACEHOLDERS[type]}
                      rows={2}
                      className="mt-2"
                    />
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
                      {SERVICE_SUB_ITEMS[type].map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <input
                            type="checkbox"
                            name={`items_${type}`}
                            value={item}
                            defaultChecked={serviceDetailsMap
                              .get(type)
                              ?.items.includes(item)}
                            className="size-3.5 accent-primary"
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                    {type === "social_media" && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label
                            htmlFor={`static_target_${type}`}
                            className="text-xs font-normal text-muted-foreground"
                          >
                            Monthly static target
                          </Label>
                          <Input
                            id={`static_target_${type}`}
                            name={`static_target_${type}`}
                            type="number"
                            min={0}
                            defaultValue={serviceDetailsMap.get(type)?.staticTarget ?? ""}
                            placeholder="10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor={`reel_target_${type}`}
                            className="text-xs font-normal text-muted-foreground"
                          >
                            Monthly reel target
                          </Label>
                          <Input
                            id={`reel_target_${type}`}
                            name={`reel_target_${type}`}
                            type="number"
                            min={0}
                            defaultValue={serviceDetailsMap.get(type)?.reelTarget ?? ""}
                            placeholder="3"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
        <Button variant="outline" type="button" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
