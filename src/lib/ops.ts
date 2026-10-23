import type { Job, JobStatus, Order, PermissionLevel, RolePermissions, TeamRole } from "@/types/crm";

/** Local calendar date as YYYY-MM-DD (not UTC, so "today" matches the clock on the wall). */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function shiftDateKey(key: string, days: number): string {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** "13:30" or "13:30:00" -> minutes after midnight. Missing -> null. */
export function timeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
}

/** "13:30" -> "1:30p", "08:00" -> "8a" */
export function formatShortTime(time: string | null | undefined): string {
  const mins = timeToMinutes(time);
  if (mins === null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? "p" : "a";
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, "0")}${suffix}` : `${h12}${suffix}`;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export function orderBalance(order: Pick<Order, "total" | "paid">): number {
  return Math.max(0, Number(order.total || 0) - Number(order.paid || 0));
}

export function isOrderPastDue(order: Pick<Order, "status" | "due_date">, today: string): boolean {
  return order.status !== "delivered" && !!order.due_date && order.due_date < today;
}

export type OrderFilter = "todo" | "past_due" | "unpaid" | "all";

export const ORDER_FILTERS: { value: OrderFilter; label: string }[] = [
  { value: "todo", label: "To fulfil" },
  { value: "past_due", label: "Past due" },
  { value: "unpaid", label: "Unpaid" },
  { value: "all", label: "All" },
];

export function filterOrders(orders: Order[], filter: OrderFilter, today: string): Order[] {
  const keep: Record<OrderFilter, (o: Order) => boolean> = {
    todo: (o) => o.status !== "delivered" || orderBalance(o) > 0,
    past_due: (o) => isOrderPastDue(o, today),
    unpaid: (o) => orderBalance(o) > 0,
    all: () => true,
  };
  return orders
    .filter(keep[filter])
    .sort(
      (a, b) =>
        Number(isOrderPastDue(b, today)) - Number(isOrderPastDue(a, today)) ||
        (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"),
    );
}

export function orderTotals(orders: Order[]) {
  const total = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const paid = orders.reduce((s, o) => s + Number(o.paid || 0), 0);
  return { total, paid, owed: orders.reduce((s, o) => s + orderBalance(o), 0) };
}

/** Next number in a series like O-311 -> "O-312". Starts at 100 for an empty list. */
export function nextNumber(existing: (string | null)[], prefix: string): string {
  let max = 100;
  for (const value of existing) {
    const match = value?.match(/(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}-${max + 1}`;
}

// ---------------------------------------------------------------------------
// Jobs / dispatch
// ---------------------------------------------------------------------------

export function isUnscheduled(job: Pick<Job, "tech_id" | "scheduled_date">): boolean {
  return !job.tech_id || !job.scheduled_date;
}

/** Scheduled jobs on a day, optionally for one tech, in start-time order. */
export function jobsForDay(jobs: Job[], date: string, techId: string | "all" = "all"): Job[] {
  return jobs
    .filter((j) => !isUnscheduled(j) && j.scheduled_date === date && (techId === "all" || j.tech_id === techId))
    .sort((a, b) => (timeToMinutes(a.start_time) ?? 0) - (timeToMinutes(b.start_time) ?? 0));
}

/**
 * Where the "now" line goes in a day's list: the index of the first job that
 * starts after `nowMinutes` (jobs.length if they've all started).
 */
export function nowLineIndex(dayJobs: Job[], nowMinutes: number): number {
  const idx = dayJobs.findIndex((j) => (timeToMinutes(j.start_time) ?? 0) > nowMinutes);
  return idx === -1 ? dayJobs.length : idx;
}

/** One status dot per tech for the day: late beats active beats scheduled; all done = done. */
export function techDayStatus(dayJobs: Job[]): JobStatus | "free" {
  if (dayJobs.length === 0) return "free";
  if (dayJobs.some((j) => j.status === "late")) return "late";
  if (dayJobs.some((j) => j.status === "in_progress")) return "in_progress";
  if (dayJobs.every((j) => j.status === "done")) return "done";
  return "scheduled";
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export const PERMISSION_OBJECTS: {
  key: string;
  label: string;
  hint?: string;
  levels: PermissionLevel[];
}[] = [
  { key: "jobs", label: "Jobs", levels: ["none", "view", "edit"] },
  { key: "customers", label: "Customers & leads", levels: ["none", "view", "edit"] },
  { key: "quotes", label: "Quotes", hint: "Own = only the ones they created", levels: ["none", "own", "all"] },
  { key: "orders", label: "Orders", levels: ["none", "view", "edit"] },
  { key: "cost", label: "Cost & margin", levels: ["hidden", "view"] },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<TeamRole, RolePermissions> = {
  owner: { jobs: "edit", customers: "edit", quotes: "all", orders: "edit", cost: "view" },
  admin: { jobs: "edit", customers: "edit", quotes: "all", orders: "edit", cost: "view" },
  sales: { jobs: "edit", customers: "edit", quotes: "own", orders: "edit", cost: "view" },
  field_tech: { jobs: "edit", customers: "view", quotes: "none", orders: "view", cost: "hidden" },
  viewer: { jobs: "view", customers: "view", quotes: "none", orders: "view", cost: "hidden" },
};

/** What the database itself enforces for each role (see 0002 migration). */
export function roleCanEditRecords(role: TeamRole | null | undefined): boolean {
  return role === "owner" || role === "admin" || role === "sales";
}

export function roleCanManageTeam(role: TeamRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function roleCanUpdateJobStatus(role: TeamRole | null | undefined): boolean {
  return roleCanEditRecords(role) || role === "field_tech";
}

export const MEMBER_COLORS = ["#2563eb", "#16a34a", "#c026d3", "#ea580c", "#0891b2", "#9333ea", "#dc2626"];

export function initials(name: string | null | undefined): string {
  return (
    String(name ?? "?")
      .trim()
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
