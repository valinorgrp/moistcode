import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Activity, Lead, NewActivity, NewLead, NewQuote, Quote } from "@/types/crm";

/**
 * JSON-file-backed store used only when no Supabase project is configured yet
 * (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` unset). Lets the
 * whole app be previewed and demoed before wiring up a real database.
 *
 * Persisted to disk (rather than kept as an in-memory module singleton)
 * because Next.js's dev server does not guarantee Server Components and
 * Route Handlers share a single module instance — a plain in-memory array
 * written from an API route would not reliably be visible to a page render.
 * Server-only: never imported by client components.
 */

const DEMO_USER_ID = "demo-user";
const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "demo-store.json");

interface Store {
  leads: Lead[];
  quotes: Quote[];
  activities: Activity[];
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function id() {
  return crypto.randomUUID();
}

function seedStore(): Store {
  const leadIds = Array.from({ length: 7 }, () => id());

  const leads: Lead[] = [
    {
      id: leadIds[0],
      user_id: DEMO_USER_ID,
      name: "Dana Whitfield",
      company: "Northwind Traders",
      email: "dana@northwind.com",
      phone: "555-0110",
      status: "proposal",
      value: 18500,
      source: "Referral",
      notes: "Wants a 12-month contract, decision by end of month.",
      created_at: daysFromNow(-21),
      updated_at: daysFromNow(-2),
    },
    {
      id: leadIds[1],
      user_id: DEMO_USER_ID,
      name: "Marcus Lee",
      company: "Brightside Robotics",
      email: "marcus@brightside.io",
      phone: "555-0122",
      status: "negotiation",
      value: 42000,
      source: "Inbound",
      notes: "Negotiating on price, wants a 10% discount for annual prepay.",
      created_at: daysFromNow(-40),
      updated_at: daysFromNow(-1),
    },
    {
      id: leadIds[2],
      user_id: DEMO_USER_ID,
      name: "Priya Shah",
      company: "Cascade Analytics",
      email: "priya@cascadeanalytics.com",
      phone: "555-0134",
      status: "qualified",
      value: 9800,
      source: "Cold outreach",
      notes: null,
      created_at: daysFromNow(-8),
      updated_at: daysFromNow(-3),
    },
    {
      id: leadIds[3],
      user_id: DEMO_USER_ID,
      name: "Oliver Grant",
      company: "Grant & Holt LLP",
      email: "oliver@grantholt.com",
      phone: "555-0145",
      status: "contacted",
      value: 6200,
      source: "Website",
      notes: "Left a voicemail, waiting on callback.",
      created_at: daysFromNow(-5),
      updated_at: daysFromNow(-5),
    },
    {
      id: leadIds[4],
      user_id: DEMO_USER_ID,
      name: "Sofia Reyes",
      company: "Lumen Skincare",
      email: "sofia@lumenskincare.com",
      phone: "555-0156",
      status: "new",
      value: 3000,
      source: "Trade show",
      notes: null,
      created_at: daysFromNow(-1),
      updated_at: daysFromNow(-1),
    },
    {
      id: leadIds[5],
      user_id: DEMO_USER_ID,
      name: "Ken Ibarra",
      company: "Ibarra Logistics",
      email: "ken@ibarralogistics.com",
      phone: "555-0167",
      status: "won",
      value: 27500,
      source: "Referral",
      notes: "Signed 2-year agreement.",
      created_at: daysFromNow(-60),
      updated_at: daysFromNow(-15),
    },
    {
      id: leadIds[6],
      user_id: DEMO_USER_ID,
      name: "Helena Brooks",
      company: "Brooks Dental Group",
      email: "helena@brooksdental.com",
      phone: "555-0178",
      status: "lost",
      value: 5400,
      source: "Cold outreach",
      notes: "Went with a competitor on price.",
      created_at: daysFromNow(-30),
      updated_at: daysFromNow(-20),
    },
  ];

  const quotes: Quote[] = [
    {
      id: id(),
      user_id: DEMO_USER_ID,
      lead_id: leadIds[0],
      quote_number: "Q-1042",
      amount: 18500,
      status: "sent",
      sent_at: daysFromNow(-3),
      valid_until: daysFromNow(27),
      notes: null,
      created_at: daysFromNow(-4),
      updated_at: daysFromNow(-3),
    },
    {
      id: id(),
      user_id: DEMO_USER_ID,
      lead_id: leadIds[1],
      quote_number: "Q-1043",
      amount: 42000,
      status: "sent",
      sent_at: daysFromNow(-10),
      valid_until: daysFromNow(5),
      notes: "Revised after discount request.",
      created_at: daysFromNow(-12),
      updated_at: daysFromNow(-10),
    },
    {
      id: id(),
      user_id: DEMO_USER_ID,
      lead_id: leadIds[5],
      quote_number: "Q-1030",
      amount: 27500,
      status: "accepted",
      sent_at: daysFromNow(-58),
      valid_until: daysFromNow(-28),
      notes: null,
      created_at: daysFromNow(-59),
      updated_at: daysFromNow(-55),
    },
    {
      id: id(),
      user_id: DEMO_USER_ID,
      lead_id: leadIds[6],
      quote_number: "Q-1035",
      amount: 5400,
      status: "declined",
      sent_at: daysFromNow(-25),
      valid_until: daysFromNow(-10),
      notes: null,
      created_at: daysFromNow(-26),
      updated_at: daysFromNow(-20),
    },
    {
      id: id(),
      user_id: DEMO_USER_ID,
      lead_id: leadIds[2],
      quote_number: null,
      amount: 9800,
      status: "draft",
      sent_at: null,
      valid_until: null,
      notes: "Still finalizing scope.",
      created_at: daysFromNow(-2),
      updated_at: daysFromNow(-2),
    },
  ];

  const activities: Activity[] = [
    {
      id: id(),
      user_id: DEMO_USER_ID,
      lead_id: leadIds[0],
      type: "call",
      subject: "Follow up on proposal questions",
      notes: null,
      due_at: daysFromNow(-1),
      completed_at: null,
      created_at: daysFromNow(-4),
    },
    {
      id: id(),
      user_id: DEMO_USER_ID,
      lead_id: leadIds[1],
      type: "email",
      subject: "Send revised pricing with annual discount",
      notes: null,
      due_at: daysFromNow(0),
      completed_at: null,
      created_at: daysFromNow(-2),
    },
    {
      id: id(),
      user_id: DEMO_USER_ID,
      lead_id: leadIds[2],
      type: "meeting",
      subject: "Demo call with Priya",
      notes: null,
      due_at: daysFromNow(2),
      completed_at: null,
      created_at: daysFromNow(-1),
    },
    {
      id: id(),
      user_id: DEMO_USER_ID,
      lead_id: leadIds[3],
      type: "call",
      subject: "Callback re: voicemail",
      notes: null,
      due_at: daysFromNow(1),
      completed_at: null,
      created_at: daysFromNow(-3),
    },
    {
      id: id(),
      user_id: DEMO_USER_ID,
      lead_id: leadIds[4],
      type: "task",
      subject: "Send intro email + pricing sheet",
      notes: null,
      due_at: daysFromNow(3),
      completed_at: null,
      created_at: daysFromNow(-1),
    },
    {
      id: id(),
      user_id: DEMO_USER_ID,
      lead_id: leadIds[5],
      type: "note",
      subject: "Contract signed, kicked off onboarding",
      notes: null,
      due_at: null,
      completed_at: daysFromNow(-15),
      created_at: daysFromNow(-15),
    },
  ];

  return { leads, quotes, activities };
}

function readStore(): Store {
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, "utf-8")) as Store;
  } catch {
    const seeded = seedStore();
    writeStore(seeded);
    return seeded;
  }
}

function writeStore(store: Store) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

function touch<T extends { updated_at?: string }>(row: T): T {
  return { ...row, updated_at: new Date().toISOString() };
}

export const mockDb = {
  listLeads(): Lead[] {
    return [...readStore().leads].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  getLead(leadId: string): Lead | undefined {
    return readStore().leads.find((l) => l.id === leadId);
  },
  createLead(input: NewLead): Lead {
    const store = readStore();
    const now = new Date().toISOString();
    const row: Lead = { ...input, id: id(), user_id: DEMO_USER_ID, created_at: now, updated_at: now };
    store.leads.unshift(row);
    writeStore(store);
    return row;
  },
  updateLead(leadId: string, patch: Partial<Lead>): Lead | undefined {
    const store = readStore();
    const idx = store.leads.findIndex((l) => l.id === leadId);
    if (idx === -1) return undefined;
    store.leads[idx] = touch({ ...store.leads[idx], ...patch });
    writeStore(store);
    return store.leads[idx];
  },

  listQuotes(): Quote[] {
    return [...readStore().quotes].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  createQuote(input: NewQuote): Quote {
    const store = readStore();
    const now = new Date().toISOString();
    const row: Quote = { ...input, id: id(), user_id: DEMO_USER_ID, created_at: now, updated_at: now };
    store.quotes.unshift(row);
    writeStore(store);
    return row;
  },
  updateQuote(quoteId: string, patch: Partial<Quote>): Quote | undefined {
    const store = readStore();
    const idx = store.quotes.findIndex((q) => q.id === quoteId);
    if (idx === -1) return undefined;
    store.quotes[idx] = touch({ ...store.quotes[idx], ...patch });
    writeStore(store);
    return store.quotes[idx];
  },

  listActivities(): Activity[] {
    return [...readStore().activities].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  createActivity(input: NewActivity): Activity {
    const store = readStore();
    const row: Activity = { ...input, id: id(), user_id: DEMO_USER_ID, created_at: new Date().toISOString() };
    store.activities.unshift(row);
    writeStore(store);
    return row;
  },
  completeActivity(activityId: string, completed: boolean): Activity | undefined {
    const store = readStore();
    const idx = store.activities.findIndex((a) => a.id === activityId);
    if (idx === -1) return undefined;
    store.activities[idx] = {
      ...store.activities[idx],
      completed_at: completed ? new Date().toISOString() : null,
    };
    writeStore(store);
    return store.activities[idx];
  },
};
