import type { ActivityType, LeadStatus, QuoteStatus } from "@/types/crm";

export interface LeadDraftFields {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status?: LeadStatus;
  value?: number;
  source?: string;
  notes?: string;
}

export interface QuoteDraftFields {
  lead_name?: string;
  amount: number;
  status?: QuoteStatus;
  valid_until?: string;
  notes?: string;
}

export interface ActivityDraftFields {
  lead_name?: string;
  type: ActivityType;
  subject: string;
  notes?: string;
  due_at?: string;
}

export type ParsedDraft =
  | { entity: "lead"; fields: LeadDraftFields }
  | { entity: "quote"; fields: QuoteDraftFields }
  | { entity: "activity"; fields: ActivityDraftFields };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  kind: "text" | "draft" | "saved" | "error";
  text?: string;
  draft?: ParsedDraft;
  matchedLeadId?: string | null;
}
