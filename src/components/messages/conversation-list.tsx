"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/message";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

interface ConversationListProps {
  conversations: Conversation[];
  basePath: string;
}

export function ConversationList({ conversations, basePath }: ConversationListProps) {
  const pathname = usePathname();

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description="Conversations appear here once a client exists."
        className="border-0"
      />
    );
  }

  return (
    <nav className="flex flex-col divide-y divide-border overflow-y-auto">
      {conversations.map(({ client, lastMessage }) => {
        const active = pathname === `${basePath}/${client.id}`;

        return (
          <Link
            key={client.id}
            href={`${basePath}/${client.id}`}
            className={cn(
              "flex items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent",
              active && "bg-accent",
            )}
          >
            <Avatar className="size-9 shrink-0">
              <AvatarFallback className="text-xs">
                {getInitials(client.company_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium">{client.company_name}</p>
                {lastMessage && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(lastMessage.created_at)}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {lastMessage ? lastMessage.body : "No messages yet"}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
