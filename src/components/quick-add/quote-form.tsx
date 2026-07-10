"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { createQuote } from "@/lib/data/quotes";
import { listLeads } from "@/lib/data/leads";
import type { Lead } from "@/types/crm";
import { Field, inputClass } from "@/components/ui/field";
import { quoteFormSchema, type QuoteFormValues } from "./schemas";

type QuoteFormInput = z.input<typeof quoteFormSchema>;

export function QuoteForm({
  defaultLeadId,
  onSaved,
}: {
  defaultLeadId?: string;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuoteFormInput, unknown, QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: { status: "draft", lead_id: defaultLeadId },
  });

  useEffect(() => {
    listLeads(createClient()).then(setLeads);
  }, []);

  async function onSubmit(values: QuoteFormValues) {
    setSubmitting(true);
    const supabase = createClient();
    const isSent = values.status !== "draft";
    await createQuote(supabase, {
      lead_id: values.lead_id || null,
      quote_number: values.quote_number || null,
      amount: values.amount,
      status: values.status,
      sent_at: isSent ? new Date().toISOString() : null,
      valid_until: values.valid_until || null,
      notes: values.notes || null,
    });
    setSubmitting(false);
    router.refresh();
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount" error={errors.amount?.message}>
          <input
            type="number"
            step="0.01"
            className={inputClass}
            placeholder="0.00"
            {...register("amount")}
          />
        </Field>
        <Field label="Quote #">
          <input className={inputClass} placeholder="Q-1044" {...register("quote_number")} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <select className={inputClass} {...register("status")}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="expired">Expired</option>
          </select>
        </Field>
        <Field label="Valid until">
          <input type="date" className={inputClass} {...register("valid_until")} />
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
        {submitting ? "Saving..." : "Add quote"}
      </button>
    </form>
  );
}
