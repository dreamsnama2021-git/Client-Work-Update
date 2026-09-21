import {
  LayoutDashboard,
  Users,
  CheckSquare,
  ClipboardCheck,
  MessageSquare,
  FileText,
  Calendar,
  UsersRound,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Tasks", href: "/admin/tasks", icon: CheckSquare },
  { label: "Approvals", href: "/admin/approvals", icon: ClipboardCheck },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { label: "Files", href: "/admin/files", icon: FileText },
  { label: "Calendar", href: "/admin/calendar", icon: Calendar },
  { label: "Team", href: "/admin/team", icon: UsersRound },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
