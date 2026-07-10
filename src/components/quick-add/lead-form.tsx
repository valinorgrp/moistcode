"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { createLead } from "@/lib/data/leads";
import { LEAD_STAGES } from "@/types/crm";
import { Field, inputClass } from "@/components/ui/field";
import { leadFormSchema, type LeadFormValues } from "./schemas";

type LeadFormInput = z.input<typeof leadFormSchema>;

export function LeadForm({ onSaved }: { onSaved: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormInput, unknown, LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { status: "new", value: 0 },
  });

  async function onSubmit(values: LeadFormValues) {
    setSubmitting(true);
    const supabase = createClient();
    await createLead(supabase, {
      name: values.name,
      company: values.company || null,
      email: values.email || null,
      phone: values.phone || null,
      status: values.status,
      value: values.value,
      source: values.source || null,
      notes: values.notes || null,
    });
    setSubmitting(false);
    router.refresh();
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Name" error={errors.name?.message}>
        <input className={inputClass} placeholder="Jane Cooper" {...register("name")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company">
          <input className={inputClass} placeholder="Acme Co." {...register("company")} />
        </Field>
        <Field label="Deal value" error={errors.value?.message}>
          <input
            type="number"
            step="0.01"
            className={inputClass}
            placeholder="0"
            {...register("value")}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email" error={errors.email?.message}>
          <input className={inputClass} placeholder="jane@acme.com" {...register("email")} />
        </Field>
        <Field label="Phone">
          <input className={inputClass} placeholder="555-0100" {...register("phone")} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Stage">
          <select className={inputClass} {...register("status")}>
            {LEAD_STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Source">
          <input className={inputClass} placeholder="Referral" {...register("source")} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea className={inputClass} rows={3} {...register("notes")} />
      </Field>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Add lead"}
      </button>
    </form>
  );
}
