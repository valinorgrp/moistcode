import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listQuotes } from "@/lib/data/quotes";
import { listLeads } from "@/lib/data/leads";
import { formatCurrency, formatRelativeDate } from "@/lib/format";
import { QuickAddButton } from "@/components/quick-add/quick-add-button";
import { QuoteStatusBadge } from "@/components/quotes/quote-status";

export default async function QuotesPage() {
  const supabase = await createClient();
  const [quotes, leads] = await Promise.all([listQuotes(supabase), listLeads(supabase)]);
  const leadById = new Map(leads.map((l) => [l.id, l]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Quotes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{quotes.length} quotes</p>
        </div>
        <QuickAddButton kind="quote" label="Add quote" />
      </div>

      <div className="space-y-2">
        {quotes.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">No quotes yet.</p>
        )}
        {quotes.map((quote) => {
          const lead = quote.lead_id ? leadById.get(quote.lead_id) : undefined;
          return (
            <div
              key={quote.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {quote.quote_number ?? "Untitled quote"}
                </p>
                {lead && (
                  <Link
                    href={`/leads/${lead.id}`}
                    className="truncate text-xs text-slate-500 hover:text-orange-600 dark:text-slate-400"
                  >
                    {lead.name}
                    {lead.company ? ` · ${lead.company}` : ""}
                  </Link>
                )}
                {quote.sent_at && (
                  <p className="text-xs text-slate-400">Sent {formatRelativeDate(quote.sent_at)}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {formatCurrency(quote.amount)}
                </span>
                <QuoteStatusBadge status={quote.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
