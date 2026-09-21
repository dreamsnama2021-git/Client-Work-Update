"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { ProfileDropdown } from "./profile-dropdown";
import { SearchBar } from "./search-bar";
import type { Notification } from "@/types/notification";

interface HeaderProps {
  onMenuClick: () => void;
  user: {
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  notifications: Notification[];
}

export function Header({ onMenuClick, user, notifications }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open sidebar"
        onClick={onMenuClick}
        className="md:hidden"
      >
        <Menu className="size-4" />
      </Button>

      <SearchBar className="hidden sm:block" />

      <div className="ml-auto flex items-center gap-1.5">
        <NotificationsDropdown notifications={notifications} />
        <ProfileDropdown
          fullName={user.fullName}
          email={user.email}
          avatarUrl={user.avatarUrl}
        />
      </div>
    </header>
  );
}
