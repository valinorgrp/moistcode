export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export type ActivityType = "call" | "email" | "meeting" | "note" | "task";

export const LEAD_STAGES: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const OPEN_PIPELINE_STAGES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
];

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  value: number;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  user_id: string;
  lead_id: string | null;
  quote_number: string | null;
  amount: number;
  status: QuoteStatus;
  sent_at: string | null;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  lead_id: string | null;
  type: ActivityType;
  subject: string;
  notes: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export type NewLead = Omit<
  Lead,
  "id" | "user_id" | "created_at" | "updated_at"
>;
export type NewQuote = Omit<
  Quote,
  "id" | "user_id" | "created_at" | "updated_at"
>;
export type NewActivity = Omit<Activity, "id" | "user_id" | "created_at">;

// ---------------------------------------------------------------------------
// Workspaces, team, orders, jobs (Phase 3 — see supabase/migrations/0002)
// ---------------------------------------------------------------------------

export type TeamRole = "owner" | "admin" | "sales" | "field_tech" | "viewer";

export const TEAM_ROLES: { value: TeamRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "sales", label: "Sales" },
  { value: "field_tech", label: "Field Tech" },
  { value: "viewer", label: "Viewer" },
];

export interface Workspace {
  id: string;
  name: string;
  /** The signed-in person's role here. */
  myRole: TeamRole;
  /** The signed-in person's team_members row. */
  myMemberId: string | null;
}

export interface TeamMember {
  id: string;
  workspace_id: string;
  user_id: string | null;
  email: string | null;
  name: string;
  trade: string | null;
  role: TeamRole;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export type NewTeamMember = Pick<TeamMember, "name" | "email" | "trade" | "role" | "color">;

export type OrderStatus = "confirmed" | "in_progress" | "delivered";

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "delivered", label: "Delivered" },
];

export interface Order {
  id: string;
  workspace_id: string;
  user_id: string | null;
  order_number: string | null;
  lead_id: string | null;
  quote_id: string | null;
  customer: string;
  due_date: string | null;
  status: OrderStatus;
  total: number;
  paid: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NewOrder = Pick<
  Order,
  "order_number" | "lead_id" | "quote_id" | "customer" | "due_date" | "status" | "total" | "paid" | "notes"
>;

export type JobStatus = "scheduled" | "in_progress" | "done" | "late";

export const JOB_STATUSES: { value: JobStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "late", label: "Running late" },
];

export interface Job {
  id: string;
  workspace_id: string;
  user_id: string | null;
  job_number: string | null;
  order_id: string | null;
  lead_id: string | null;
  customer: string;
  title: string | null;
  /** team_members.id; null = unscheduled */
  tech_id: string | null;
  /** YYYY-MM-DD; null = unscheduled */
  scheduled_date: string | null;
  /** HH:MM or HH:MM:SS */
  start_time: string | null;
  duration_hours: number;
  status: JobStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NewJob = Pick<
  Job,
  | "job_number"
  | "order_id"
  | "lead_id"
  | "customer"
  | "title"
  | "tech_id"
  | "scheduled_date"
  | "start_time"
  | "duration_hours"
  | "status"
  | "notes"
>;

export interface AuditEntry {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  entity: string;
  entity_id: string | null;
  summary: string;
  created_at: string;
}

export type PermissionLevel = "none" | "view" | "edit" | "own" | "all" | "hidden";
export type RolePermissions = Record<string, PermissionLevel>;
