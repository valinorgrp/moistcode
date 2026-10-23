"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  createTeamMember,
  deleteTeamMember,
  renameWorkspace,
  setRolePermissions,
  updateTeamMember,
} from "@/lib/data/ops";
import { MEMBER_COLORS, PERMISSION_OBJECTS, roleCanManageTeam } from "@/lib/ops";
import {
  TEAM_ROLES,
  type AuditEntry,
  type PermissionLevel,
  type RolePermissions,
  type TeamMember,
  type TeamRole,
  type Workspace,
} from "@/types/crm";
import { Sheet } from "@/components/ui/sheet";
import { Field, inputClass } from "@/components/ui/field";
import {
  Chip,
  EmptyState,
  MemberAvatar,
  PageHeader,
  RoleBadge,
  Toast,
  dangerButton,
  primaryButton,
  sectionLabel,
  useSave,
} from "./shared";

const roleLabel = (r: TeamRole) => TEAM_ROLES.find((x) => x.value === r)?.label ?? r;

/** What the database enforces for each role, in plain words. */
const ENFORCED: Record<TeamRole, string> = {
  owner: "Full access, including the team and these settings.",
  admin: "Full access, including the team and these settings.",
  sales: "Adds and edits leads, quotes, orders and jobs. Can't change the team.",
  field_tech: "Sees everything; can update a job's status and notes. Can't reschedule or edit sales records.",
  viewer: "Can look at everything but can't change anything.",
};

type SheetState = { mode: "add" } | { mode: "edit"; member: TeamMember } | null;

export function TeamBoard({
  workspace,
  team,
  permissions,
  audit,
}: {
  workspace: Workspace;
  team: TeamMember[];
  permissions: Record<TeamRole, RolePermissions>;
  audit: AuditEntry[];
}) {
  const { save, pending, toast } = useSave();
  const [sheet, setSheet] = useState<SheetState>(null);
  const [role, setRole] = useState<TeamRole>("field_tech");
  const [name, setName] = useState(workspace.name);
  const canManage = roleCanManageTeam(workspace.myRole);
  const me = team.find((m) => m.id === workspace.myMemberId);
  const nameByUser = new Map(team.filter((m) => m.user_id).map((m) => [m.user_id!, m.name]));
  const current = permissions[role];

  function setLevel(key: string, level: PermissionLevel) {
    save(() => setRolePermissions(createClient(), workspace.id, role, { ...current, [key]: level }), "Saved");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <PageHeader
        title="Team"
        subtitle={`${workspace.name} · ${team.length} ${team.length === 1 ? "person" : "people"}`}
        right={<RoleBadge role={roleLabel(workspace.myRole)} />}
      />

      {canManage && (
        <form
          className="mb-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && name.trim() !== workspace.name) {
              save(() => renameWorkspace(createClient(), workspace.id, name.trim()), "Business name saved");
            }
          }}
        >
          <label className="sr-only" htmlFor="ws-name">
            Business name
          </label>
          <input id="ws-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          <button
            className="shrink-0 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-slate-900"
            disabled={pending || !name.trim() || name.trim() === workspace.name}
          >
            Rename
          </button>
        </form>
      )}

      <section className="mb-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className={sectionLabel + " mb-0"}>People</h2>
          {canManage && (
            <button
              type="button"
              onClick={() => setSheet({ mode: "add" })}
              className="flex items-center gap-1.5 text-sm font-semibold text-orange-700 dark:text-orange-400"
            >
              <UserPlus size={16} /> Add or invite
            </button>
          )}
        </div>
        {team.length === 0 ? (
          <EmptyState title="No one here yet">Add the people who take jobs, quote, or run the office.</EmptyState>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {team.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <MemberAvatar member={m} size={38} />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left disabled:cursor-default"
                  disabled={!canManage}
                  onClick={() => setSheet({ mode: "edit", member: m })}
                >
                  <span className="block truncate font-medium text-slate-900 dark:text-white">
                    {m.name}
                    {m.id === workspace.myMemberId && <span className="font-normal text-slate-600 dark:text-slate-400"> (you)</span>}
                  </span>
                  <span className="block truncate text-xs text-slate-600 dark:text-slate-400">
                    {[m.trade, m.user_id ? "Can sign in" : m.email ? `Invited · ${m.email}` : "Schedule only"]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
                {canManage && m.role !== "owner" ? (
                  <select
                    aria-label={`Role for ${m.name}`}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
                    value={m.role}
                    disabled={pending}
                    onChange={(e) =>
                      save(
                        () => updateTeamMember(createClient(), m.id, { role: e.target.value as TeamRole }),
                        `${m.name} is now ${roleLabel(e.target.value as TeamRole)}`,
                      )
                    }
                  >
                    {TEAM_ROLES.filter((r) => r.value !== "owner" || workspace.myRole === "owner").map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {roleLabel(m.role)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <h2 className={sectionLabel}>What each role can do</h2>
        <div className="no-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto px-1" role="group" aria-label="Pick a role">
          {TEAM_ROLES.map((r) => (
            <Chip key={r.value} active={role === r.value} onClick={() => setRole(r.value)}>
              {r.label}
            </Chip>
          ))}
        </div>
        <p className="mb-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          <b className="text-slate-900 dark:text-white">Always enforced:</b> {ENFORCED[role]}
        </p>
        <div className="rounded-2xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
          {PERMISSION_OBJECTS.map((obj) => (
            <div
              key={obj.key}
              className="flex items-center justify-between gap-3 border-t border-slate-100 py-2.5 first:border-t-0 dark:border-slate-800"
            >
              <div className="min-w-0 text-sm text-slate-800 dark:text-slate-100">
                {obj.label}
                {obj.hint && <span className="block text-xs text-slate-600 dark:text-slate-400">{obj.hint}</span>}
              </div>
              <div className="flex shrink-0 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                {obj.levels.map((lvl) => {
                  const on = current[obj.key] === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      aria-pressed={on}
                      disabled={!canManage || role === "owner" || pending}
                      onClick={() => setLevel(obj.key, lvl)}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-xs capitalize disabled:cursor-default",
                        on
                          ? lvl === "none" || lvl === "hidden"
                            ? "bg-slate-500 font-semibold text-white"
                            : lvl === "own"
                              ? "bg-orange-700 font-semibold text-white"
                              : "bg-emerald-700 font-semibold text-white"
                          : "text-slate-600 dark:text-slate-400",
                      )}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          {role === "owner"
            ? "The owner always has full access."
            : "These finer settings are saved per role and will drive what each screen shows as the app grows. The “Always enforced” rule above is checked by the database on every change."}
        </p>
      </section>

      <section>
        <h2 className={sectionLabel}>Recent activity</h2>
        <div className="rounded-2xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
          {audit.length === 0 ? (
            <p className="py-3 text-sm text-slate-600 dark:text-slate-400">Changes to jobs, orders and the team show up here.</p>
          ) : (
            audit.map((a) => (
              <p key={a.id} className="border-t border-slate-100 py-2.5 text-sm text-slate-700 first:border-t-0 dark:border-slate-800 dark:text-slate-200">
                <b className="font-semibold text-slate-900 dark:text-white">
                  {a.actor_id && a.actor_id === me?.user_id ? "You" : (a.actor_id && nameByUser.get(a.actor_id)) || "Someone"}
                </b>{" "}
                {a.summary}
                <span className="block text-xs text-slate-600 dark:text-slate-400">
                  {new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              </p>
            ))
          )}
        </div>
      </section>

      <Sheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet?.mode === "edit" ? `Edit ${sheet.member.name}` : "Add or invite someone"}
      >
        {sheet && (
          <MemberForm
            key={sheet.mode === "edit" ? sheet.member.id : "add"}
            member={sheet.mode === "edit" ? sheet.member : undefined}
            pending={pending}
            canPickOwner={workspace.myRole === "owner"}
            onSubmit={(values) =>
              sheet.mode === "edit"
                ? save(() => updateTeamMember(createClient(), sheet.member.id, values), "Saved", () => setSheet(null))
                : save(
                    () =>
                      createTeamMember(createClient(), workspace.id, {
                        ...values,
                        color: MEMBER_COLORS[team.length % MEMBER_COLORS.length],
                      }),
                    values.email ? `${values.name} invited` : `${values.name} added`,
                    () => setSheet(null),
                  )
            }
            onRemove={
              sheet.mode === "edit" && sheet.member.role !== "owner"
                ? () =>
                    save(() => deleteTeamMember(createClient(), sheet.member.id), `${sheet.member.name} removed`, () =>
                      setSheet(null),
                    )
                : undefined
            }
          />
        )}
      </Sheet>
      <Toast toast={toast} />
    </div>
  );
}

function MemberForm({
  member,
  pending,
  canPickOwner,
  onSubmit,
  onRemove,
}: {
  member?: TeamMember;
  pending: boolean;
  canPickOwner: boolean;
  onSubmit: (values: { name: string; email: string | null; trade: string | null; role: TeamRole }) => void;
  onRemove?: () => void;
}) {
  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [trade, setTrade] = useState(member?.trade ?? "");
  const [role, setRole] = useState<TeamRole>(member?.role ?? "field_tech");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState("");
  const isOwner = member?.role === "owner";

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return setError("Add their name.");
        if (email && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError("That email doesn't look right.");
        setError("");
        onSubmit({ name: name.trim(), email: email.trim().toLowerCase() || null, trade: trade.trim() || null, role });
      }}
    >
      <Field label="Name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jake Reyes" />
      </Field>
      <Field label="Email (to let them sign in)">
        <input
          className={inputClass}
          type="email"
          value={email}
          disabled={Boolean(member?.user_id)}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Leave blank for schedule-only crew"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Trade or job">
          <input className={inputClass} value={trade} onChange={(e) => setTrade(e.target.value)} placeholder="HVAC, Office…" />
        </Field>
        <Field label="Role">
          <select className={inputClass} value={role} disabled={isOwner} onChange={(e) => setRole(e.target.value as TeamRole)}>
            {TEAM_ROLES.filter((r) => r.value !== "owner" || canPickOwner || isOwner).map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {!member && (
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {isSupabaseConfigured
            ? "With an email, they can sign up at this site using that address and they'll land in your workspace with this role. Send them the link yourself."
            : "Demo mode: invites are saved but no one can sign in until Supabase is connected."}
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className={primaryButton} disabled={pending}>
        {member ? "Save" : email ? "Add and invite" : "Add to the schedule"}
      </button>
      {onRemove && (
        <button
          type="button"
          className={dangerButton}
          disabled={pending}
          onClick={() => (confirmRemove ? onRemove() : setConfirmRemove(true))}
        >
          {confirmRemove ? "Tap again to remove" : "Remove from team"}
        </button>
      )}
    </form>
  );
}
