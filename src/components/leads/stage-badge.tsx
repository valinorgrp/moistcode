import { cn } from "@/lib/cn";
import { LEAD_STAGES, type LeadStatus } from "@/types/crm";

const STAGE_CLASSES: Record<LeadStatus, string> = {
  new: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  contacted: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  qualified: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  proposal: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  negotiation: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  lost: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
};

export function StageBadge({ status }: { status: LeadStatus }) {
  const label = LEAD_STAGES.find((s) => s.value === status)?.label ?? status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STAGE_CLASSES[status],
      )}
    >
      {label}
    </span>
  );
}
