import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listLeads } from "@/lib/data/leads";
import { LEAD_STAGES, type LeadStatus } from "@/types/crm";
import { LeadCard } from "@/components/leads/lead-card";
import { QuickAddButton } from "@/components/quick-add/quick-add-button";
import { cn } from "@/lib/cn";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;
  const supabase = await createClient();
  const leads = await listLeads(supabase);

  const filtered = stage ? leads.filter((l) => l.status === stage) : leads;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Pipeline</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} leads</p>
        </div>
        <QuickAddButton kind="lead" label="Add lead" />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        <StageFilterLink stage={undefined} label="All" active={!stage} />
        {LEAD_STAGES.map((s) => (
          <StageFilterLink
            key={s.value}
            stage={s.value}
            label={s.label}
            active={stage === s.value}
          />
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">No leads in this stage yet.</p>
        )}
        {filtered.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

function StageFilterLink({
  stage,
  label,
  active,
}: {
  stage: LeadStatus | undefined;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={stage ? `/leads?stage=${stage}` : "/leads"}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-orange-500 bg-orange-500 text-white"
          : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
      )}
    >
      {label}
    </Link>
  );
}
