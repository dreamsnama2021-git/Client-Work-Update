"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";

const NAV_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/client", icon: LayoutDashboard },
  { label: "Approvals", href: "/client/approvals", icon: ClipboardCheck },
  { label: "Messages", href: "/client/messages", icon: MessageSquare },
  { label: "Files", href: "/client/files", icon: FileText },
];

function isActive(pathname: string, href: string) {
  if (href === "/client") return pathname === "/client";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

interface ClientHeaderProps {
  user: {
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  notifications: Notification[];
}

export function ClientHeader({ user, notifications }: ClientHeaderProps) {
  const pathname = usePathname();
  const displayName = user.fullName || user.email;

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border bg-background px-4 sm:gap-6 md:px-6">
      <Link href="/client" aria-label="Greens Media home" className="flex shrink-0 items-center">
        <BrandLogo className="h-10" />
      </Link>

      <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3",
                isActive(pathname, item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
        <NotificationsDropdown notifications={notifications} />
        <div className="hidden items-center gap-2 sm:flex">
          <Avatar className="size-7">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={displayName} />}
            <AvatarFallback className="text-[10px]">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{displayName}</span>
        </div>
        <form action={signOut}>
          <Button variant="ghost" size="icon" type="submit" aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
