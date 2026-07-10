"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { createActivity } from "@/lib/data/activities";
import { listLeads } from "@/lib/data/leads";
import type { Lead } from "@/types/crm";
import { Field, inputClass } from "@/components/ui/field";
import { activityFormSchema, type ActivityFormValues } from "./schemas";

type ActivityFormInput = z.input<typeof activityFormSchema>;

export function ActivityForm({
  defaultLeadId,
  defaultDueAt,
  onSaved,
}: {
  defaultLeadId?: string;
  defaultDueAt?: string;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityFormInput, unknown, ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      type: "task",
      lead_id: defaultLeadId,
      due_at: defaultDueAt?.slice(0, 16),
    },
  });

  useEffect(() => {
    listLeads(createClient()).then(setLeads);
  }, []);

  async function onSubmit(values: ActivityFormValues) {
    setSubmitting(true);
    const supabase = createClient();
    await createActivity(supabase, {
      lead_id: values.lead_id || null,
      type: values.type,
      subject: values.subject,
      notes: values.notes || null,
      due_at: values.due_at ? new Date(values.due_at).toISOString() : null,
      completed_at: null,
    });
    setSubmitting(false);
    router.refresh();
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Subject" error={errors.subject?.message}>
        <input
          className={inputClass}
          placeholder="Follow up call"
          {...register("subject")}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select className={inputClass} {...register("type")}>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="task">Task</option>
            <option value="note">Note</option>
          </select>
        </Field>
        <Field label="Due">
          <input type="datetime-local" className={inputClass} {...register("due_at")} />
        </Field>
      </div>
      <Field label="Lead / deal">
        <select className={inputClass} {...register("lead_id")}>
          <option value="">— No lead —</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} {l.company ? `(${l.company})` : ""}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes">
        <textarea className={inputClass} rows={3} {...register("notes")} />
      </Field>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Add activity"}
      </button>
    </form>
  );
}
