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
