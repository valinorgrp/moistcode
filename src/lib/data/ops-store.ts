import "server-only";
import fs from "node:fs";
import path from "node:path";
import type {
  AuditEntry,
  Job,
  NewJob,
  NewOrder,
  NewTeamMember,
  Order,
  RolePermissions,
  TeamMember,
  TeamRole,
  Workspace,
} from "@/types/crm";
import { DEFAULT_ROLE_PERMISSIONS, formatShortTime, toDateKey } from "@/lib/ops";

/**
 * Demo-mode store for workspaces, team, orders, jobs and the audit log.
 * Same idea as mock-store.ts (JSON file under .data/, server-only, used only
 * by the /api/demo/ops/* routes) but kept in its own file so the original
 * demo data isn't disturbed. Delete .data/demo-ops.json to reset it.
 */

const DEMO_USER_ID = "demo-user";
const WORKSPACE_ID = "demo-workspace";
const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "demo-ops.json");

interface OpsStore {
  workspace: { id: string; name: string };
  team: TeamMember[];
  permissions: Partial<Record<TeamRole, RolePermissions>>;
  orders: Order[];
  jobs: Job[];
  audit: AuditEntry[];
}

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function day(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toDateKey(d);
}

function member(name: string, role: TeamRole, trade: string | null, color: string, userId: string | null = null): TeamMember {
  const t = now();
  return {
    id: id(),
    workspace_id: WORKSPACE_ID,
    user_id: userId,
    email: null,
    name,
    trade,
    role,
    color,
    created_at: t,
    updated_at: t,
  };
}

function seed(): OpsStore {
  const t = now();
  const owner = member("You", "owner", "Owner", "#ea580c", DEMO_USER_ID);
  const jake = member("Jake Reyes", "field_tech", "HVAC", "#2563eb");
  const ana = member("Ana Molina", "field_tech", "Install", "#16a34a");
  const dev = member("Dev Kapoor", "sales", "Estimates", "#c026d3");

  const order = (n: string, customer: string, due: number, total: number, paid: number, status: Order["status"]): Order => ({
    id: id(),
    workspace_id: WORKSPACE_ID,
    user_id: DEMO_USER_ID,
    order_number: n,
    lead_id: null,
    quote_id: null,
    customer,
    due_date: day(due),
    status,
    total,
    paid,
    notes: null,
    created_at: t,
    updated_at: t,
  });
  const orders = [
    order("O-306", "Moyer Packing", -3, 8750, 0, "confirmed"),
    order("O-309", "Souderton Schools", 7, 24000, 12000, "in_progress"),
    order("O-311", "Penn View Farms", 5, 15200, 4560, "confirmed"),
    order("O-304", "Lansdale Dental", 0, 7200, 7200, "delivered"),
  ];

  const job = (
    n: string,
    customer: string,
    title: string,
    tech: TeamMember | null,
    start: string | null,
    hours: number,
    status: Job["status"],
    orderId: string | null = null,
  ): Job => ({
    id: id(),
    workspace_id: WORKSPACE_ID,
    user_id: DEMO_USER_ID,
    job_number: n,
    order_id: orderId,
    lead_id: null,
    customer,
    title,
    tech_id: tech?.id ?? null,
    scheduled_date: tech ? day(0) : null,
    start_time: start,
    duration_hours: hours,
    status,
    notes: null,
    created_at: t,
    updated_at: t,
  });
  const jobs = [
    job("J-218", "Lansdale Dental", "AC tune-up", jake, "08:00", 3, "done", orders[3].id),
    job("J-221", "Souderton Schools", "Boiler service", jake, "11:30", 3, "in_progress", orders[1].id),
    job("J-222", "Moyer Packing", "Compressor swap", ana, "10:00", 2, "late"),
    job("J-224", "Rivera Properties", "Unit 1 rough-in", ana, "15:00", 2, "scheduled"),
    job("J-226", "North Penn YMCA", "Filter change", null, null, 1, "scheduled"),
    job("J-227", "Penn View Farms", "Barn heater install", null, null, 4, "scheduled", orders[2].id),
  ];

  const entry = (summary: string, minutesAgo: number): AuditEntry => ({
    id: id(),
    workspace_id: WORKSPACE_ID,
    actor_id: DEMO_USER_ID,
    entity: "jobs",
    entity_id: null,
    summary,
    created_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  });

  return {
    workspace: { id: WORKSPACE_ID, name: "Demo crew" },
    team: [owner, jake, ana, dev],
    permissions: {},
    orders,
    jobs,
    audit: [entry("set J-222 Moyer Packing to late", 6), entry("recorded $4,560.00 on O-311 Penn View Farms", 32)],
  };
}

function read(): OpsStore {
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, "utf-8")) as OpsStore;
  } catch {
    const s = seed();
    write(s);
    return s;
  }
}

function write(store: OpsStore) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

function log(store: OpsStore, entity: string, entityId: string | null, summary: string) {
  store.audit.unshift({
    id: id(),
    workspace_id: WORKSPACE_ID,
    actor_id: DEMO_USER_ID,
    entity,
    entity_id: entityId,
    summary,
    created_at: now(),
  });
  store.audit = store.audit.slice(0, 200);
}

const human = (s: string) => s.replace(/_/g, " ");
const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const opsDb = {
  getWorkspace(): Workspace {
    const s = read();
    const me = s.team.find((m) => m.user_id === DEMO_USER_ID);
    return { ...s.workspace, myRole: me?.role ?? "owner", myMemberId: me?.id ?? null };
  },
  renameWorkspace(name: string) {
    const s = read();
    s.workspace.name = name;
    write(s);
  },

  listTeam(): TeamMember[] {
    return read().team;
  },
  createTeamMember(input: NewTeamMember): TeamMember {
    const s = read();
    const row = { ...member(input.name, input.role, input.trade, input.color ?? "#64748b"), email: input.email };
    s.team.push(row);
    log(s, "team_members", row.id, `added ${row.name} to the team as ${human(row.role)}`);
    write(s);
    return row;
  },
  updateTeamMember(memberId: string, patch: Partial<NewTeamMember>): TeamMember | undefined {
    const s = read();
    const idx = s.team.findIndex((m) => m.id === memberId);
    if (idx === -1) return undefined;
    const before = s.team[idx];
    s.team[idx] = { ...before, ...patch, updated_at: now() };
    log(
      s,
      "team_members",
      memberId,
      patch.role && patch.role !== before.role ? `made ${before.name} ${human(patch.role)}` : `edited ${before.name}`,
    );
    write(s);
    return s.team[idx];
  },
  deleteTeamMember(memberId: string): boolean {
    const s = read();
    const m = s.team.find((x) => x.id === memberId);
    if (!m || m.role === "owner") return false;
    s.team = s.team.filter((x) => x.id !== memberId);
    s.jobs = s.jobs.map((j) => (j.tech_id === memberId ? { ...j, tech_id: null } : j));
    log(s, "team_members", memberId, `removed ${m.name} from the team`);
    write(s);
    return true;
  },

  getPermissions(): Record<TeamRole, RolePermissions> {
    const stored = read().permissions;
    const merged = structuredClone(DEFAULT_ROLE_PERMISSIONS);
    for (const role of Object.keys(stored) as TeamRole[]) merged[role] = { ...merged[role], ...stored[role] };
    return merged;
  },
  setPermissions(role: TeamRole, permissions: RolePermissions) {
    const s = read();
    s.permissions[role] = permissions;
    write(s);
  },

  listOrders(): Order[] {
    return read().orders;
  },
  createOrder(input: NewOrder): Order {
    const s = read();
    const t = now();
    const row: Order = { ...input, id: id(), workspace_id: WORKSPACE_ID, user_id: DEMO_USER_ID, created_at: t, updated_at: t };
    s.orders.push(row);
    log(s, "orders", row.id, `added ${row.order_number ?? "an order"} ${row.customer}`);
    write(s);
    return row;
  },
  updateOrder(orderId: string, patch: Partial<NewOrder>): Order | undefined {
    const s = read();
    const idx = s.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return undefined;
    const before = s.orders[idx];
    const after = { ...before, ...patch, updated_at: now() };
    s.orders[idx] = after;
    const label = `${before.order_number ?? "an order"} ${before.customer}`;
    const summary =
      patch.paid !== undefined && Number(patch.paid) !== Number(before.paid)
        ? `recorded ${money(Number(patch.paid) - Number(before.paid))} on ${label}`
        : patch.status && patch.status !== before.status
          ? `set ${label} to ${human(patch.status)}`
          : `edited ${label}`;
    log(s, "orders", orderId, summary);
    write(s);
    return after;
  },
  deleteOrder(orderId: string): boolean {
    const s = read();
    const o = s.orders.find((x) => x.id === orderId);
    if (!o) return false;
    s.orders = s.orders.filter((x) => x.id !== orderId);
    s.jobs = s.jobs.map((j) => (j.order_id === orderId ? { ...j, order_id: null } : j));
    log(s, "orders", orderId, `deleted ${o.order_number ?? "an order"} ${o.customer}`);
    write(s);
    return true;
  },

  listJobs(): Job[] {
    return read().jobs;
  },
  createJob(input: NewJob): Job {
    const s = read();
    const t = now();
    const row: Job = { ...input, id: id(), workspace_id: WORKSPACE_ID, user_id: DEMO_USER_ID, created_at: t, updated_at: t };
    s.jobs.push(row);
    log(s, "jobs", row.id, `added ${row.job_number ?? "a job"} ${row.customer}`);
    write(s);
    return row;
  },
  updateJob(jobId: string, patch: Partial<NewJob>): Job | undefined {
    const s = read();
    const idx = s.jobs.findIndex((j) => j.id === jobId);
    if (idx === -1) return undefined;
    const before = s.jobs[idx];
    const after = { ...before, ...patch, updated_at: now() };
    s.jobs[idx] = after;
    const label = `${before.job_number ?? "a job"} ${before.customer}`;
    let summary = `edited ${label}`;
    if (patch.status && patch.status !== before.status) summary = `set ${label} to ${human(patch.status)}`;
    else if (
      after.tech_id !== before.tech_id ||
      after.scheduled_date !== before.scheduled_date ||
      after.start_time !== before.start_time
    ) {
      const tech = s.team.find((m) => m.id === after.tech_id);
      summary =
        !after.tech_id || !after.scheduled_date
          ? `unscheduled ${label}`
          : `booked ${label} with ${tech?.name ?? "a tech"} on ${after.scheduled_date} at ${formatShortTime(after.start_time)}`;
    }
    log(s, "jobs", jobId, summary);
    write(s);
    return after;
  },
  deleteJob(jobId: string): boolean {
    const s = read();
    const j = s.jobs.find((x) => x.id === jobId);
    if (!j) return false;
    s.jobs = s.jobs.filter((x) => x.id !== jobId);
    log(s, "jobs", jobId, `deleted ${j.job_number ?? "a job"} ${j.customer}`);
    write(s);
    return true;
  },

  listAudit(limit: number): AuditEntry[] {
    return read().audit.slice(0, limit);
  },
};
