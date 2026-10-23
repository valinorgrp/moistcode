"use client";

import { Fragment, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  formatShortTime,
  isUnscheduled,
  jobsForDay,
  nowLineIndex,
  roleCanEditRecords,
  roleCanManageTeam,
  roleCanUpdateJobStatus,
  shiftDateKey,
  techDayStatus,
} from "@/lib/ops";
import { TEAM_ROLES, type Job, type TeamMember, type Workspace } from "@/types/crm";
import { JobSheet, type JobSheetState } from "./job-sheet";
import {
  EmptyState,
  JOB_STATUS_STYLE,
  MemberAvatar,
  PageHeader,
  RoleBadge,
  Toast,
  sectionLabel,
  useNowMinutes,
  useSave,
  useToday,
} from "./shared";

export function DispatchBoard({
  workspace,
  team,
  jobs,
}: {
  workspace: Workspace;
  team: TeamMember[];
  jobs: Job[];
}) {
  const today = useToday();
  const nowMinutes = useNowMinutes();
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [techId, setTechId] = useState<string | "all">("all");
  const [sheet, setSheet] = useState<JobSheetState | null>(null);
  const { save, pending, toast } = useSave();

  const date = pickedDate ?? today;
  const role = workspace.myRole;
  const canSchedule = roleCanEditRecords(role);
  const crew = team.filter((m) => m.role !== "viewer");
  const memberById = new Map(team.map((m) => [m.id, m]));

  const allDay = date ? jobsForDay(jobs, date) : [];
  const shown = date ? jobsForDay(jobs, date, techId) : [];
  const late = allDay.filter((j) => j.status === "late");
  const unscheduled = jobs.filter(isUnscheduled);
  const isToday = date !== null && date === today;
  const nowIdx = isToday && nowMinutes !== null ? nowLineIndex(shown, nowMinutes) : -1;
  const techCount = new Set(allDay.map((j) => j.tech_id)).size;
  const roleLabel = TEAM_ROLES.find((r) => r.value === role)?.label ?? role;

  const dayLabel = date
    ? `${isToday ? "Today · " : ""}${new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}`
    : "Today";

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <PageHeader
        title="Dispatch"
        subtitle={`${techCount} ${techCount === 1 ? "tech" : "techs"} · ${allDay.length} ${allDay.length === 1 ? "visit" : "visits"}`}
        right={<RoleBadge role={roleLabel} />}
      />

      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous day"
          disabled={!date}
          onClick={() => date && setPickedDate(shiftDateKey(date, -1))}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => setPickedDate(null)}
          className="flex-1 text-center text-sm font-semibold text-slate-900 dark:text-white"
          title="Back to today"
        >
          {dayLabel}
        </button>
        <button
          type="button"
          aria-label="Next day"
          disabled={!date}
          onClick={() => date && setPickedDate(shiftDateKey(date, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {late.length > 0 && (
        <button
          type="button"
          onClick={() => setSheet({ mode: "edit", job: late[0] })}
          className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-left dark:border-red-900 dark:bg-red-950/60"
        >
          <TriangleAlert size={18} className="shrink-0 text-red-600 dark:text-red-400" />
          <span className="min-w-0 flex-1 text-sm text-red-800 dark:text-red-200">
            <b className="block text-slate-900 dark:text-white">
              {memberById.get(late[0].tech_id ?? "")?.name ?? "A tech"} is running late
            </b>
            {late[0].job_number} {late[0].customer}
            {late.length > 1 ? ` · +${late.length - 1} more` : ""}
          </span>
          <span className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">Fix</span>
        </button>
      )}

      <div className="no-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 pt-1" role="group" aria-label="Choose a tech">
        <TechChip active={techId === "all"} onClick={() => setTechId("all")} label="Everyone">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-slate-300 text-xs font-bold text-slate-500 dark:border-slate-700">
            All
          </span>
        </TechChip>
        {crew.map((m) => {
          const status = date ? techDayStatus(jobsForDay(jobs, date, m.id)) : "free";
          return (
            <TechChip key={m.id} active={techId === m.id} onClick={() => setTechId(m.id)} label={m.name.split(" ")[0]}>
              <MemberAvatar
                member={m}
                size={44}
                dotClass={status === "free" ? "bg-slate-300 dark:bg-slate-600" : JOB_STATUS_STYLE[status].dot}
              />
            </TechChip>
          );
        })}
      </div>

      {crew.length === 0 ? (
        <EmptyState title="Add your crew first">Go to Team and add the people you send out on jobs.</EmptyState>
      ) : !date ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
      ) : shown.length === 0 ? (
        <EmptyState title={`Nothing booked${techId === "all" ? "" : ` for ${memberById.get(techId)?.name ?? ""}`}`}>
          {canSchedule ? "Add a job, or assign one from the unscheduled list below." : "Nothing on the schedule for this day."}
        </EmptyState>
      ) : (
        <ol className="space-y-2">
          {shown.map((job, i) => {
            const tech = memberById.get(job.tech_id ?? "");
            const style = JOB_STATUS_STYLE[job.status];
            return (
              <Fragment key={job.id}>
                {i === nowIdx && <NowLine minutes={nowMinutes!} />}
                <li className="flex gap-2.5">
                  <span className="w-11 shrink-0 pt-3 text-right font-mono text-xs text-slate-400">
                    {formatShortTime(job.start_time)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSheet({ mode: "edit", job })}
                    className={cn("min-w-0 flex-1 rounded-xl border-l-4 px-3 py-2.5 text-left text-xs", style.card)}
                  >
                    <b className="block truncate text-sm">
                      {job.job_number} {job.customer}
                    </b>
                    {job.title ? `${job.title} · ` : ""}
                    {style.label} · {Number(job.duration_hours)}h
                    {techId === "all" && tech && (
                      <span className="mt-1 flex items-center gap-1.5 opacity-80">
                        <MemberAvatar member={tech} size={18} />
                        {tech.name}
                      </span>
                    )}
                  </button>
                </li>
              </Fragment>
            );
          })}
          {nowIdx === shown.length && <NowLine minutes={nowMinutes!} />}
        </ol>
      )}

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className={sectionLabel + " mb-0"}>
            {unscheduled.length} unscheduled {unscheduled.length === 1 ? "job" : "jobs"}
          </h2>
          {canSchedule && (
            <button
              type="button"
              onClick={() => date && setSheet({ mode: "new", date, techId: techId === "all" ? null : techId })}
              className="flex items-center gap-1 text-sm font-semibold text-orange-600 dark:text-orange-400"
            >
              <Plus size={16} /> Add job
            </button>
          )}
        </div>
        {unscheduled.length > 0 ? (
          <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto">
            {unscheduled.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => setSheet({ mode: "edit", job })}
                className="min-w-36 shrink-0 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {job.job_number} {job.customer}
                <span className="block text-xs font-normal text-slate-500">
                  {Number(job.duration_hours)}h{job.title ? ` · ${job.title}` : ""}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Every job has a time and a tech.</p>
        )}
      </section>

      <JobSheet
        state={sheet}
        onClose={() => setSheet(null)}
        team={team}
        jobs={jobs}
        save={save}
        pending={pending}
        canSchedule={canSchedule}
        canUpdateStatus={roleCanUpdateJobStatus(role)}
        canDelete={roleCanManageTeam(role)}
        defaultDate={date}
      />
      <Toast toast={toast} />
    </div>
  );
}

function TechChip({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl py-1 text-xs",
        active ? "font-semibold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400",
      )}
    >
      <span className={cn("rounded-full", active && "ring-2 ring-orange-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950")}>
        {children}
      </span>
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}

function NowLine({ minutes }: { minutes: number }) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return (
    <li aria-label="Current time" className="ml-[3.4rem] flex items-center gap-2 font-mono text-[11px] font-bold text-red-500">
      NOW {formatShortTime(`${hh}:${mm}`)}
      <span className="h-0.5 flex-1 bg-red-500" />
    </li>
  );
}
