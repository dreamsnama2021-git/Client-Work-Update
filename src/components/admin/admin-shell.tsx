"use client";

import { useState } from "react";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import type { Notification } from "@/types/notification";

interface AdminShellProps {
  children: React.ReactNode;
  user: {
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  notifications: Notification[];
}

export function AdminShell({ children, user, notifications }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          notifications={notifications}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
