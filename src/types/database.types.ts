import type { ActivityType, Priority, TaskStatus } from "./dashboard";

export type UserRole = "admin" | "client";
export type ClientStatus = "active" | "inactive";
export type ApprovalStatus = "pending" | "approved" | "revision_requested";
export type ServiceType = "social_media" | "website" | "production" | "offline";
export type WebsiteStatus =
  | "live_with_maintenance"
  | "live_without_maintenance"
  | "in_making"
  | "maintenance";
export type SlotContentType = "static" | "reel";
export type { ActivityType, Priority, TaskStatus };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          role: UserRole;
          full_name: string | null;
          avatar_url: string | null;
          company: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: UserRole;
          full_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          phone?: string | null;
        };
        Update: {
          role?: UserRole;
          full_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          phone?: string | null;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          company_name: string;
          contact_name: string;
          contact_email: string;
          phone: string | null;
          website: string | null;
          status: ClientStatus;
          notes: string | null;
          avatar_url: string | null;
          profile_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_name: string;
          contact_email: string;
          phone?: string | null;
          website?: string | null;
          status?: ClientStatus;
          notes?: string | null;
          avatar_url?: string | null;
          profile_id?: string | null;
          created_by?: string | null;
        };
        Update: {
          company_name?: string;
          contact_name?: string;
          contact_email?: string;
          phone?: string | null;
          website?: string | null;
          status?: ClientStatus;
          notes?: string | null;
          avatar_url?: string | null;
          profile_id?: string | null;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          description: string | null;
          assignee_name: string;
          status: TaskStatus;
          priority: Priority;
          due_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          description?: string | null;
          assignee_name: string;
          status?: TaskStatus;
          priority?: Priority;
          due_date?: string | null;
          created_by?: string | null;
        };
        Update: {
          client_id?: string;
          name?: string;
          description?: string | null;
          assignee_name?: string;
          status?: TaskStatus;
          priority?: Priority;
          due_date?: string | null;
        };
        Relationships: [];
      };
      approvals: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          description: string | null;
          status: ApprovalStatus;
          feedback: string | null;
          submitted_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          description?: string | null;
          status?: ApprovalStatus;
          feedback?: string | null;
          submitted_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: {
          client_id?: string;
          title?: string;
          description?: string | null;
          status?: ApprovalStatus;
          feedback?: string | null;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          client_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          sender_id: string;
          body: string;
        };
        Update: {
          body?: string;
        };
        Relationships: [];
      };
      files: {
        Row: {
          id: string;
          client_id: string;
          uploaded_by: string | null;
          name: string;
          storage_path: string;
          size_bytes: number;
          mime_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          uploaded_by?: string | null;
          name: string;
          storage_path: string;
          size_bytes: number;
          mime_type?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      activity_events: {
        Row: {
          id: string;
          type: ActivityType;
          actor_id: string | null;
          message: string;
          target: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: ActivityType;
          actor_id?: string | null;
          message: string;
          target: string;
        };
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          title: string;
          description: string;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          title: string;
          description: string;
          link?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [];
      };
      client_services: {
        Row: {
          id: string;
          client_id: string;
          service_type: ServiceType;
          details: string | null;
          static_target: number | null;
          reel_target: number | null;
          site_status: WebsiteStatus | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          service_type: ServiceType;
          details?: string | null;
          static_target?: number | null;
          reel_target?: number | null;
          site_status?: WebsiteStatus | null;
        };
        Update: {
          details?: string | null;
          static_target?: number | null;
          reel_target?: number | null;
          site_status?: WebsiteStatus | null;
        };
        Relationships: [];
      };
      client_work_slots: {
        Row: {
          id: string;
          client_id: string;
          month: string;
          content_type: SlotContentType;
          slot_number: number;
          completed_count: number;
          ready_at: string | null;
          sent_to_client_at: string | null;
          client_approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          month: string;
          content_type: SlotContentType;
          slot_number: number;
          completed_count?: number;
          ready_at?: string | null;
          sent_to_client_at?: string | null;
          client_approved_at?: string | null;
        };
        Update: {
          completed_count?: number;
          ready_at?: string | null;
          sent_to_client_at?: string | null;
          client_approved_at?: string | null;
        };
        Relationships: [];
      };
      client_service_items: {
        Row: {
          id: string;
          client_id: string;
          service_type: ServiceType;
          item: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          service_type: ServiceType;
          item: string;
        };
        Update: never;
        Relationships: [];
      };
      client_extra_work: {
        Row: {
          id: string;
          client_id: string;
          month: string;
          description: string;
          sent_to_client_at: string | null;
          client_approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          month: string;
          description?: string;
          sent_to_client_at?: string | null;
          client_approved_at?: string | null;
        };
        Update: {
          description?: string;
          sent_to_client_at?: string | null;
          client_approved_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      client_status: ClientStatus;
      task_status: TaskStatus;
      priority: Priority;
      approval_status: ApprovalStatus;
      activity_type: ActivityType;
      service_type: ServiceType;
      website_status: WebsiteStatus;
      slot_content_type: SlotContentType;
    };
    CompositeTypes: Record<string, never>;
  };
}
