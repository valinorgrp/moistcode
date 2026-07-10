import { z } from "zod";

export const leadFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.enum([
    "new",
    "contacted",
    "qualified",
    "proposal",
    "negotiation",
    "won",
    "lost",
  ]),
  value: z.coerce.number().min(0, "Must be 0 or more"),
  source: z.string().optional(),
  notes: z.string().optional(),
});
export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const quoteFormSchema = z.object({
  lead_id: z.string().optional(),
  quote_number: z.string().optional(),
  amount: z.coerce.number().min(0.01, "Enter an amount"),
  status: z.enum(["draft", "sent", "accepted", "declined", "expired"]),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
});
export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export const activityFormSchema = z.object({
  lead_id: z.string().optional(),
  type: z.enum(["call", "email", "meeting", "note", "task"]),
  subject: z.string().min(1, "Subject is required"),
  notes: z.string().optional(),
  due_at: z.string().optional(),
});
export type ActivityFormValues = z.infer<typeof activityFormSchema>;
