import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { ClientStatus } from "@/types/client";

const STATUS_CONFIG: Record<ClientStatus, { label: string; variant: BadgeProps["variant"] }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "secondary" },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
