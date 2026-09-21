import { Clapperboard, Globe, Package, Share2, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVICE_LABELS } from "@/types/client";
import type { ClientService, ClientServiceItem, ServiceType } from "@/types/client";

const SERVICE_ICONS: Record<ServiceType, LucideIcon> = {
  social_media: Share2,
  website: Globe,
  production: Clapperboard,
  offline: Package,
};

export function ClientServicesCard({
  services,
  serviceItems = [],
}: {
  services: ClientService[];
  serviceItems?: ClientServiceItem[];
}) {
  if (services.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {services.map((service) => {
          const Icon = SERVICE_ICONS[service.service_type];
          const items = serviceItems.filter(
            (i) => i.service_type === service.service_type,
          );
          return (
            <div key={service.id} className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-sm font-medium">
                  {SERVICE_LABELS[service.service_type]}
                </p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {service.details || "No details added."}
                </p>
                {items.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((i) => (
                      <span
                        key={i.id}
                        className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {i.item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
