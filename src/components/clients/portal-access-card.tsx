"use client";

import { useActionState, useState } from "react";
import { Link2, Link2Off } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createClientPortalAccount,
  linkClientPortalAccount,
  unlinkClientPortalAccount,
  type CreatePortalActionState,
  type LinkPortalActionState,
} from "@/lib/actions/clients";

const linkInitialState: LinkPortalActionState = { error: null };
const createInitialState: CreatePortalActionState = { error: null };

interface PortalAccessCardProps {
  clientId: string;
  linkedEmail: string | null;
}

export function PortalAccessCard({ clientId, linkedEmail }: PortalAccessCardProps) {
  const [mode, setMode] = useState<"create" | "link">("create");

  const linkAction = linkClientPortalAccount.bind(null, clientId);
  const [linkState, linkFormAction, linkPending] = useActionState(
    linkAction,
    linkInitialState,
  );

  const createAction = createClientPortalAccount.bind(null, clientId);
  const [createState, createFormAction, createPending] = useActionState(
    createAction,
    createInitialState,
  );

  const unlinkAction = unlinkClientPortalAccount.bind(null, clientId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portal Access</CardTitle>
        <CardDescription>
          Let this client sign in to review and approve their own work.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {linkedEmail ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Link2 className="size-4 text-success" />
              <span>
                Linked to <span className="font-medium">{linkedEmail}</span>
              </span>
            </div>
            <form action={unlinkAction}>
              <Button variant="outline" size="sm" type="submit">
                <Link2Off className="size-4" />
                Unlink
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-1 rounded-md border border-border p-1 text-sm">
              <button
                type="button"
                onClick={() => setMode("create")}
                className={
                  mode === "create"
                    ? "flex-1 rounded-sm bg-accent py-1.5 font-medium"
                    : "flex-1 rounded-sm py-1.5 text-muted-foreground"
                }
              >
                Create new login
              </button>
              <button
                type="button"
                onClick={() => setMode("link")}
                className={
                  mode === "link"
                    ? "flex-1 rounded-sm bg-accent py-1.5 font-medium"
                    : "flex-1 rounded-sm py-1.5 text-muted-foreground"
                }
              >
                Link existing account
              </button>
            </div>

            {mode === "create" ? (
              <form action={createFormAction} className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Set an email and password for this client — they can sign
                  in with it right away.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="portal-email">Email</Label>
                  <Input
                    id="portal-email"
                    name="email"
                    type="email"
                    placeholder="client@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portal-password">Password</Label>
                  <Input
                    id="portal-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    placeholder="At least 6 characters"
                    required
                  />
                </div>
                <Button type="submit" disabled={createPending}>
                  {createPending ? "Creating…" : "Create login"}
                </Button>
                {createState.error && (
                  <p className="text-xs text-destructive">{createState.error}</p>
                )}
              </form>
            ) : (
              <form action={linkFormAction} className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Enter the email they already signed up with — they&apos;ll
                  get access to this client&apos;s tasks and approvals.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    name="email"
                    type="email"
                    placeholder="client@company.com"
                    required
                    className="sm:max-w-xs"
                  />
                  <Button type="submit" disabled={linkPending}>
                    {linkPending ? "Linking…" : "Link account"}
                  </Button>
                </div>
                {linkState.error && (
                  <p className="text-xs text-destructive">{linkState.error}</p>
                )}
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
