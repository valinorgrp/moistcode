import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { Lead } from "@/types/crm";
import { StageBadge } from "./stage-badge";

export function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500/50"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{lead.name}</p>
        {lead.company && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{lead.company}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {formatCurrency(lead.value)}
        </span>
        <StageBadge status={lead.status} />
      </div>
    </Link>
  );
}
