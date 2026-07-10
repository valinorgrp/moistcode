import Link from "next/link";
import type { PipelineStageSummary } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/format";

const STAGE_COLORS: Record<string, string> = {
  new: "bg-slate-400",
  contacted: "bg-sky-400",
  qualified: "bg-violet-400",
  proposal: "bg-amber-400",
  negotiation: "bg-orange-500",
  won: "bg-emerald-500",
  lost: "bg-rose-400",
};

export function PipelineStages({ stages }: { stages: PipelineStageSummary[] }) {
  const openStages = stages.filter((s) => s.status !== "won" && s.status !== "lost");
  const maxCount = Math.max(1, ...openStages.map((s) => s.count));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Pipeline by stage</h2>
        <Link href="/leads" className="text-xs font-medium text-orange-600 hover:underline">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {openStages.map((stage) => (
          <Link
            key={stage.status}
            href={`/leads?stage=${stage.status}`}
            className="block"
          >
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">{stage.label}</span>
              <span className="text-slate-500 dark:text-slate-400">
                {stage.count} · {formatCurrency(stage.value)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${STAGE_COLORS[stage.status]}`}
                style={{ width: `${(stage.count / maxCount) * 100}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
