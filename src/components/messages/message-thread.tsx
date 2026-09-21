import { MessageSquare } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";
import type { MessageWithSender } from "@/types/message";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function MessageThread({
  messages,
  currentUserId,
}: {
  messages: MessageWithSender[];
  currentUserId: string;
}) {
  if (messages.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No messages yet"
        description="Send the first message to start the conversation."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => {
        const isOwn = message.sender_id === currentUserId;
        const senderName =
          message.sender?.full_name || message.sender?.email || "Unknown";

        return (
          <div
            key={message.id}
            className={cn("flex gap-2.5", isOwn && "flex-row-reverse")}
          >
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="text-xs">
                {getInitials(senderName)}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "flex max-w-[75%] flex-col gap-1",
                isOwn && "items-end",
              )}
            >
              {!isOwn && (
                <span className="text-xs font-medium text-muted-foreground">
                  {senderName}
                </span>
              )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap",
                  isOwn
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm bg-muted text-foreground",
                )}
              >
                {message.body}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(message.created_at)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
