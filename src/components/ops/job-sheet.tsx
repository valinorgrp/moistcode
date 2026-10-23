"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Field, inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { createJob, deleteJob, updateJob } from "@/lib/data/ops";
import { formatShortTime, nextNumber } from "@/lib/ops";
import { JOB_STATUSES, type Job, type JobStatus, type NewJob, type TeamMember } from "@/types/crm";
import { JOB_STATUS_STYLE, dangerButton, primaryButton, sectionLabel, type useSave } from "./shared";

type Save = ReturnType<typeof useSave>["save"];

export type JobSheetState =
  | { mode: "new"; date: string; techId: string | null; orderId?: string | null; customer?: string }
  | { mode: "edit"; job: Job };

export function JobSheet({
  state,
  onClose,
  team,
  jobs,
  save,
  pending,
  canSchedule,
  canUpdateStatus,
  canDelete,
  defaultDate,
}: {
  state: JobSheetState | null;
  onClose: () => void;
  team: TeamMember[];
  jobs: Job[];
  save: Save;
  pending: boolean;
  canSchedule: boolean;
  canUpdateStatus: boolean;
  canDelete: boolean;
  /** The day being viewed; used when scheduling a job that has no date yet. */
  defaultDate: string | null;
}) {
  const open = state !== null;
  const title = !state ? "" : state.mode === "new" ? "New job" : `${state.job.job_number ?? "Job"} ${state.job.customer}`;
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {state?.mode === "new" && (
        <JobForm
          key="new"
          initial={{
            customer: state.customer ?? "",
            title: "",
            tech_id: state.techId,
            scheduled_date: state.date,
            start_time: "09:00",
            duration_hours: 2,
            order_id: state.orderId ?? null,
          }}
          team={team}
          pending={pending}
          submitLabel="Add job"
          onSubmit={(values) => {
            const input: NewJob = {
              job_number: nextNumber(
                jobs.map((j) => j.job_number),
                "J",
              ),
              lead_id: null,
              status: "scheduled",
              notes: null,
              ...values,
            };
            return save(() => createJob(createClient(), input), `${input.job_number} added`, onClose);
          }}
        />
      )}
      {state?.mode === "edit" && (
        <EditJob
          key={state.job.id}
          job={state.job}
          team={team}
          save={save}
          pending={pending}
          onClose={onClose}
          canSchedule={canSchedule}
          canUpdateStatus={canUpdateStatus}
          canDelete={canDelete}
          defaultDate={defaultDate}
        />
      )}
    </Sheet>
  );
}

function EditJob({
  job,
  team,
  save,
  pending,
  onClose,
  canSchedule,
  canUpdateStatus,
  canDelete,
  defaultDate,
}: {
  job: Job;
  team: TeamMember[];
  save: Save;
  pending: boolean;
  onClose: () => void;
  canSchedule: boolean;
  canUpdateStatus: boolean;
  canDelete: boolean;
  defaultDate: string | null;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const tech = team.find((m) => m.id === job.tech_id);
  const label = job.job_number ?? "Job";

  function setStatus(status: JobStatus) {
    save(
      () => updateJob(createClient(), job.id, { status }),
      `${label} marked ${JOB_STATUS_STYLE[status].label.toLowerCase()}`,
      onClose,
    );
  }

  return (
    <div className="space-y-5">
      <p className="-mt-1 text-sm text-slate-500 dark:text-slate-400">
        {job.title ? `${job.title} · ` : ""}
        {tech && job.scheduled_date
          ? `${tech.name} · ${new Date(`${job.scheduled_date}T12:00:00`).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })} ${formatShortTime(job.start_time)}`
          : "Unscheduled"}
      </p>

      {canUpdateStatus && (
        <section>
          <h3 className={sectionLabel}>Set status</h3>
          <div className="grid grid-cols-2 gap-2">
            {JOB_STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                disabled={pending}
                onClick={() => setStatus(s.value)}
                aria-pressed={job.status === s.value}
                className={cn(
                  "rounded-xl border-l-4 px-3 py-3 text-left text-sm font-semibold transition disabled:opacity-50",
                  JOB_STATUS_STYLE[s.value].card,
                  job.status === s.value && "ring-2 ring-slate-900/20 dark:ring-white/30",
                )}
              >
                {job.status === s.value ? "● " : ""}
                {s.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {canSchedule ? (
        <section>
          <h3 className={sectionLabel}>{job.tech_id ? "Move or reassign" : "Schedule it"}</h3>
          <JobForm
            initial={{
              customer: job.customer,
              title: job.title ?? "",
              tech_id: job.tech_id,
              scheduled_date: job.scheduled_date ?? defaultDate,
              start_time: job.start_time?.slice(0, 5) ?? "09:00",
              duration_hours: Number(job.duration_hours) || 1,
              order_id: job.order_id,
            }}
            team={team}
            pending={pending}
            submitLabel="Save"
            onSubmit={(values) => {
              const who = team.find((m) => m.id === values.tech_id)?.name;
              return save(
                () => updateJob(createClient(), job.id, values),
                values.tech_id && values.scheduled_date ? `${label} booked with ${who}` : `${label} moved to unscheduled`,
                onClose,
              );
            }}
          />
        </section>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ask an owner, admin or sales teammate to reschedule this job.
        </p>
      )}

      {canDelete && (
        <button
          type="button"
          className={dangerButton}
          disabled={pending}
          onClick={() => {
            if (!confirmDelete) return setConfirmDelete(true);
            save(() => deleteJob(createClient(), job.id), `${label} deleted`, onClose);
          }}
        >
          {confirmDelete ? "Tap again to delete" : "Delete job"}
        </button>
      )}
    </div>
  );
}

type JobFormValues = Pick<
  NewJob,
  "customer" | "title" | "tech_id" | "scheduled_date" | "start_time" | "duration_hours" | "order_id"
>;

function JobForm({
  initial,
  team,
  pending,
  submitLabel,
  onSubmit,
}: {
  initial: JobFormValues;
  team: TeamMember[];
  pending: boolean;
  submitLabel: string;
  onSubmit: (values: JobFormValues) => Promise<boolean>;
}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const crew = team.filter((m) => m.role !== "viewer");
  const set = <K extends keyof JobFormValues>(k: K, v: JobFormValues[K]) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!values.customer.trim()) return setError("Add the customer's name.");
        if (values.tech_id && !values.scheduled_date) return setError("Pick a date, or set the tech to Unscheduled.");
        setError("");
        const scheduled = Boolean(values.tech_id);
        onSubmit({
          ...values,
          customer: values.customer.trim(),
          title: values.title?.trim() || null,
          scheduled_date: scheduled ? values.scheduled_date : null,
          start_time: scheduled ? values.start_time : null,
          duration_hours: Number(values.duration_hours) || 1,
        });
      }}
    >
      <Field label="Customer">
        <input
          className={inputClass}
          value={values.customer}
          onChange={(e) => set("customer", e.target.value)}
          placeholder="e.g. Kowalski Bakery"
        />
      </Field>
      <Field label="Work">
        <input
          className={inputClass}
          value={values.title ?? ""}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Walk-in cooler repair"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tech">
          <select
            className={inputClass}
            value={values.tech_id ?? ""}
            onChange={(e) => set("tech_id", e.target.value || null)}
          >
            <option value="">Unscheduled</option>
            {crew.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input
            type="date"
            className={inputClass}
            value={values.scheduled_date ?? ""}
            disabled={!values.tech_id}
            onChange={(e) => set("scheduled_date", e.target.value || null)}
          />
        </Field>
        <Field label="Start">
          <input
            type="time"
            className={inputClass}
            value={values.start_time ?? ""}
            disabled={!values.tech_id}
            onChange={(e) => set("start_time", e.target.value || null)}
          />
        </Field>
        <Field label="Hours">
          <input
            type="number"
            min={0.5}
            step={0.5}
            className={inputClass}
            value={values.duration_hours}
            onChange={(e) => set("duration_hours", Number(e.target.value))}
          />
        </Field>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className={primaryButton} disabled={pending}>
        {submitLabel}
      </button>
    </form>
  );
}
