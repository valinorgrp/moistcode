import { cn } from "@/lib/cn";
import type { QuoteStatus } from "@/types/crm";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
};

const QUOTE_STATUS_CLASSES: Record<QuoteStatus, string> = {
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  sent: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  declined: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  expired: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        QUOTE_STATUS_CLASSES[status],
      )}
    >
      {QUOTE_STATUS_LABELS[status]}
    </span>
  );
}
