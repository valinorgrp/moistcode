import type { SupabaseClient } from "@supabase/supabase-js";
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
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/ops";
import { demoFetch, demoFetchOrNull } from "./demo-fetch";

/**
 * Data access for workspaces, the team, orders, jobs and the audit log.
 * Same pattern as leads.ts: Supabase when configured, otherwise the demo
 * JSON store over /api/demo/ops/*. Importable from client and server.
 */

type Client = SupabaseClient | null;
const demo = () => !isSupabaseConfigured;

function json(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

/** Supabase returns `numeric` columns as strings in some setups; normalize. */
function numbers<T extends object>(row: T, keys: (keyof T)[]): T {
  const out = { ...row };
  for (const k of keys) {
    if (out[k] !== null && out[k] !== undefined) (out as Record<keyof T, unknown>)[k] = Number(out[k]);
  }
  return out;
}

async function throwIf<T>(p: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

export async function getWorkspace(supabase: Client): Promise<Workspace> {
  if (demo() || !supabase) return demoFetch<Workspace>("/api/demo/ops/workspace");

  const wsId = await throwIf(supabase.rpc("ensure_workspace"));
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [ws, me] = await Promise.all([
    throwIf(supabase.from("workspaces").select("id, name").eq("id", wsId).single()),
    throwIf(
      supabase
        .from("team_members")
        .select("id, role")
        .eq("workspace_id", wsId)
        .eq("user_id", user!.id)
        .maybeSingle(),
    ),
  ]);
  const meRow = me as { id: string; role: TeamRole } | null;
  const wsRow = ws as { id: string; name: string };
  return { id: wsRow.id, name: wsRow.name, myRole: meRow?.role ?? "viewer", myMemberId: meRow?.id ?? null };
}

export async function renameWorkspace(supabase: Client, id: string, name: string): Promise<void> {
  if (demo() || !supabase) {
    await demoFetch("/api/demo/ops/workspace", json("PATCH", { name }));
    return;
  }
  await throwIf(supabase.from("workspaces").update({ name }).eq("id", id));
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export async function listTeam(supabase: Client): Promise<TeamMember[]> {
  if (demo() || !supabase) return demoFetch<TeamMember[]>("/api/demo/ops/team");
  const wsId = await throwIf(supabase.rpc("ensure_workspace"));
  return (await throwIf(
    supabase.from("team_members").select("*").eq("workspace_id", wsId).order("created_at"),
  )) as TeamMember[];
}

export async function createTeamMember(
  supabase: Client,
  workspaceId: string,
  input: NewTeamMember,
): Promise<TeamMember> {
  if (demo() || !supabase) return demoFetch<TeamMember>("/api/demo/ops/team", json("POST", input));
  const email = input.email?.trim().toLowerCase() || null;
  return (await throwIf(
    supabase
      .from("team_members")
      .insert({ ...input, email, workspace_id: workspaceId })
      .select("*")
      .single(),
  )) as TeamMember;
}

export async function updateTeamMember(
  supabase: Client,
  id: string,
  patch: Partial<NewTeamMember>,
): Promise<TeamMember | null> {
  if (demo() || !supabase) return demoFetchOrNull<TeamMember>(`/api/demo/ops/team/${id}`, json("PATCH", patch));
  return (await throwIf(
    supabase.from("team_members").update(patch).eq("id", id).select("*").single(),
  )) as TeamMember;
}

export async function deleteTeamMember(supabase: Client, id: string): Promise<void> {
  if (demo() || !supabase) {
    await demoFetchOrNull(`/api/demo/ops/team/${id}`, json("DELETE"));
    return;
  }
  await throwIf(supabase.from("team_members").delete().eq("id", id));
}

// ---------------------------------------------------------------------------
// Role permissions
// ---------------------------------------------------------------------------

export async function getRolePermissions(supabase: Client): Promise<Record<TeamRole, RolePermissions>> {
  if (demo() || !supabase) return demoFetch("/api/demo/ops/permissions");
  const wsId = await throwIf(supabase.rpc("ensure_workspace"));
  const rows = (await throwIf(
    supabase.from("role_permissions").select("role, permissions").eq("workspace_id", wsId),
  )) as { role: TeamRole; permissions: RolePermissions }[];
  const merged = structuredClone(DEFAULT_ROLE_PERMISSIONS);
  for (const r of rows) merged[r.role] = { ...merged[r.role], ...r.permissions };
  return merged;
}

export async function setRolePermissions(
  supabase: Client,
  workspaceId: string,
  role: TeamRole,
  permissions: RolePermissions,
): Promise<void> {
  if (demo() || !supabase) {
    await demoFetch("/api/demo/ops/permissions", json("PUT", { role, permissions }));
    return;
  }
  await throwIf(
    supabase
      .from("role_permissions")
      .upsert({ workspace_id: workspaceId, role, permissions, updated_at: new Date().toISOString() }),
  );
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const orderNums = (o: Order) => numbers(o, ["total", "paid"]);

export async function listOrders(supabase: Client): Promise<Order[]> {
  if (demo() || !supabase) return demoFetch<Order[]>("/api/demo/ops/orders");
  const wsId = await throwIf(supabase.rpc("ensure_workspace"));
  const rows = (await throwIf(
    supabase
      .from("orders")
      .select("*")
      .eq("workspace_id", wsId)
      .order("due_date", { ascending: true, nullsFirst: false }),
  )) as Order[];
  return rows.map(orderNums);
}

export async function createOrder(supabase: Client, input: NewOrder): Promise<Order> {
  if (demo() || !supabase) return demoFetch<Order>("/api/demo/ops/orders", json("POST", input));
  return orderNums((await throwIf(supabase.from("orders").insert(input).select("*").single())) as Order);
}

export async function updateOrder(supabase: Client, id: string, patch: Partial<NewOrder>): Promise<Order | null> {
  if (demo() || !supabase) return demoFetchOrNull<Order>(`/api/demo/ops/orders/${id}`, json("PATCH", patch));
  return orderNums(
    (await throwIf(supabase.from("orders").update(patch).eq("id", id).select("*").single())) as Order,
  );
}

export async function deleteOrder(supabase: Client, id: string): Promise<void> {
  if (demo() || !supabase) {
    await demoFetchOrNull(`/api/demo/ops/orders/${id}`, json("DELETE"));
    return;
  }
  await throwIf(supabase.from("orders").delete().eq("id", id));
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

const jobNums = (j: Job) => numbers(j, ["duration_hours"]);

export async function listJobs(supabase: Client): Promise<Job[]> {
  if (demo() || !supabase) return demoFetch<Job[]>("/api/demo/ops/jobs");
  const wsId = await throwIf(supabase.rpc("ensure_workspace"));
  const rows = (await throwIf(
    supabase.from("jobs").select("*").eq("workspace_id", wsId).order("created_at"),
  )) as Job[];
  return rows.map(jobNums);
}

export async function createJob(supabase: Client, input: NewJob): Promise<Job> {
  if (demo() || !supabase) return demoFetch<Job>("/api/demo/ops/jobs", json("POST", input));
  return jobNums((await throwIf(supabase.from("jobs").insert(input).select("*").single())) as Job);
}

export async function updateJob(supabase: Client, id: string, patch: Partial<NewJob>): Promise<Job | null> {
  if (demo() || !supabase) return demoFetchOrNull<Job>(`/api/demo/ops/jobs/${id}`, json("PATCH", patch));
  return jobNums((await throwIf(supabase.from("jobs").update(patch).eq("id", id).select("*").single())) as Job);
}

export async function deleteJob(supabase: Client, id: string): Promise<void> {
  if (demo() || !supabase) {
    await demoFetchOrNull(`/api/demo/ops/jobs/${id}`, json("DELETE"));
    return;
  }
  await throwIf(supabase.from("jobs").delete().eq("id", id));
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export async function listAudit(supabase: Client, limit = 25): Promise<AuditEntry[]> {
  if (demo() || !supabase) return demoFetch<AuditEntry[]>(`/api/demo/ops/audit?limit=${limit}`);
  const wsId = await throwIf(supabase.rpc("ensure_workspace"));
  return (await throwIf(
    supabase
      .from("audit_log")
      .select("*")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: false })
      .limit(limit),
  )) as AuditEntry[];
}

/** Turn a Supabase/Postgres error into something a person can act on. */
export function friendlyError(err: unknown): string {
  const msg = (err as { message?: string } | null)?.message ?? "";
  if (msg.includes("row-level security")) return "Your role doesn't allow that. Ask an owner or admin.";
  if (msg.includes("Field techs") || msg.includes("owner")) return msg;
  if (msg.includes("team_members_workspace_email_idx")) return "Someone on the team already uses that email.";
  return msg || "That didn't save. Check your connection and try again.";
}
