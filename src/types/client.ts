import type {
  ClientStatus,
  Database,
  ServiceType,
  SlotContentType,
  WebsiteStatus,
  WorkDisplayTemplate,
} from "./database.types";

export type {
  ClientStatus,
  ServiceType,
  WebsiteStatus,
  SlotContentType,
  WorkDisplayTemplate,
};
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientService = Database["public"]["Tables"]["client_services"]["Row"];
export type ClientWorkSlot =
  Database["public"]["Tables"]["client_work_slots"]["Row"];
export type ClientWorkSlotItem =
  Database["public"]["Tables"]["client_work_slot_items"]["Row"];
export type ClientWorkSlotItemNote =
  Database["public"]["Tables"]["client_work_slot_item_notes"]["Row"];
export interface ClientWorkSlotItemWithNotes extends ClientWorkSlotItem {
  notes: ClientWorkSlotItemNote[];
}
export interface ClientWorkSlotWithItems extends ClientWorkSlot {
  items: ClientWorkSlotItemWithNotes[];
}
export type ClientExtraWork =
  Database["public"]["Tables"]["client_extra_work"]["Row"];
export type ClientReference =
  Database["public"]["Tables"]["client_references"]["Row"];
export type ClientReferenceNote =
  Database["public"]["Tables"]["client_reference_notes"]["Row"];
export interface ClientReferenceWithNotes extends ClientReference {
  notes: ClientReferenceNote[];
}
export type ClientWorkPost =
  Database["public"]["Tables"]["client_work_posts"]["Row"];
export type ClientWorkPostRevision =
  Database["public"]["Tables"]["client_work_post_revisions"]["Row"];
export type ClientWorkPostRevisionNote =
  Database["public"]["Tables"]["client_work_post_revision_notes"]["Row"];
export interface ClientWorkPostRevisionWithNotes extends ClientWorkPostRevision {
  notes: ClientWorkPostRevisionNote[];
}
export interface ClientWorkPostWithRevisions extends ClientWorkPost {
  revisions: ClientWorkPostRevisionWithNotes[];
}
export type ClientServiceItem =
  Database["public"]["Tables"]["client_service_items"]["Row"];

export interface ClientFormValues {
  companyName: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  website: string;
  status: ClientStatus;
  notes: string;
}

export const SERVICE_TYPES: ServiceType[] = [
  "social_media",
  "website",
  "production",
  "offline",
];

export const SERVICE_LABELS: Record<ServiceType, string> = {
  social_media: "Social Media",
  website: "Website",
  production: "Production",
  offline: "Offline",
};

export const SERVICE_DETAILS_PLACEHOLDERS: Record<ServiceType, string> = {
  social_media: "What needs to be done — platforms, content types, posting frequency…",
  website: "What type of website — e.g. portfolio, e-commerce, landing page…",
  production: "What's being shot — e.g. product photos, reels, brand video…",
  offline: "What offline materials are needed — e.g. banners, print handouts…",
};

/** The fixed sub-service checklist shown under each main service. */
export const SERVICE_SUB_ITEMS: Record<ServiceType, string[]> = {
  website: [
    "Design",
    "Development",
    "Content",
    "Keyword Analysis",
    "SEO",
    "Maintenance",
    "Product Addition",
    "Banner",
    "GMB Account Creation",
    "GMB Update",
  ],
  social_media: [
    "Account Creation",
    "Account Logins",
    "Strategy",
    "Reference Generation",
    "Asset Gathering",
    "Page Optimization",
    "Static Post Creation",
    "Dynamic Post Creation",
    "Keyword Analysis",
    "Caption & Hashtags",
    "Post Scheduling",
    "Ad Creatives",
    "Ad Campaigns",
    "WhatsApp Creatives",
    "WhatsApp Messages",
    "Email Marketing",
    "LinkedIn Interactions",
    "Report Generation",
    "3D Product Modelling",
    "Virtual Reality",
  ],
  production: [
    "Phone Shoot (S)",
    "Phone Shoot (V)",
    "Camera Shoot (S)",
    "Camera Shoot (V)",
    "Event Shoot",
    "Data Updating",
    "Aftermovie",
  ],
  offline: ["Product", "Dimension", "Print"],
};

export const WEBSITE_STATUS_LABELS: Record<WebsiteStatus, string> = {
  live_with_maintenance: "Live (With Maintenance)",
  live_without_maintenance: "Live (Without Maintenance)",
  in_making: "In Making",
  maintenance: "Maintenance",
};

export const SLOT_CONTENT_LABELS: Record<SlotContentType, string> = {
  static: "Static",
  reel: "Reel",
};

export interface ClientFilters {
  q?: string;
  status?: ClientStatus | "all";
}
