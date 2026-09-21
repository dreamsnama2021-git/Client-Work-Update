import type { ApprovalStatus, Database } from "./database.types";

export type { ApprovalStatus };
export type Approval = Database["public"]["Tables"]["approvals"]["Row"];

export interface ApprovalWithClient extends Approval {
  client: { id: string; company_name: string } | null;
}

export interface ApprovalFilters {
  q?: string;
  status?: ApprovalStatus | "all";
  clientId?: string;
}
