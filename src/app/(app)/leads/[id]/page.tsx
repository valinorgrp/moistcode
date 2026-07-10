import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLead } from "@/lib/data/leads";
import { listQuotes } from "@/lib/data/quotes";
import { listActivities } from "@/lib/data/activities";
import { formatCurrency } from "@/lib/format";
import { StageSelector } from "@/components/leads/stage-selector";
import { ActivityRow } from "@/components/activities/activity-row";
import { QUOTE_STATUS_LABELS } from "@/components/quotes/quote-status";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const lead = await getLead(supabase, id);
  if (!lead) notFound();

  const [allQuotes, allActivities] = await Promise.all([
    listQuotes(supabase),
    listActivities(supabase),
  ]);
  const quotes = allQuotes.filter((q) => q.lead_id === lead.id);
  const activities = allActivities.filter((a) => a.lead_id === lead.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/leads"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft size={15} /> Back to pipeline
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{lead.name}</h1>
            {lead.company && (
              <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                <Building2 size={13} /> {lead.company}
              </p>
            )}
          </div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {formatCurrency(lead.value)}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
          {lead.email && (
            <span className="flex items-center gap-1.5">
              <Mail size={14} /> {lead.email}
            </span>
          )}
          {lead.phone && (
            <span className="flex items-center gap-1.5">
              <Phone size={14} /> {lead.phone}
            </span>
          )}
        </div>

        <div className="mb-4 max-w-xs">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Stage
          </label>
          <StageSelector leadId={lead.id} status={lead.status} />
        </div>

        {lead.notes && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {lead.notes}
          </p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Quotes</h2>
        {quotes.length === 0 ? (
          <p className="py-3 text-sm text-slate-400">No quotes yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {quotes.map((q) => (
              <div key={q.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700 dark:text-slate-200">
                  {q.quote_number ?? "Untitled quote"}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {formatCurrency(q.amount)} · {QUOTE_STATUS_LABELS[q.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Activity</h2>
        {activities.length === 0 ? (
          <p className="py-3 text-sm text-slate-400">No activity logged yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activities.map((a) => (
              <ActivityRow key={a.id} activity={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
