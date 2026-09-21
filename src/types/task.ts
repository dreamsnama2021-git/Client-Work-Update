import type { Database, Priority, TaskStatus } from "./database.types";

export type { TaskStatus, Priority };
export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export interface TaskWithClient extends Task {
  client: {
    id: string;
    company_name: string;
  } | null;
}

export interface TaskFilters {
  q?: string;
  status?: TaskStatus | "all";
  clientId?: string;
}
