import { DollarSign, FileText, PhoneCall, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listLeads } from "@/lib/data/leads";
import { listQuotes } from "@/lib/data/quotes";
import { listActivities } from "@/lib/data/activities";
import { computeDashboardStats } from "@/lib/dashboard";
import { formatCurrency, formatPercent } from "@/lib/format";
import { StatCard } from "@/components/dashboard/stat-card";
import { PipelineStages } from "@/components/dashboard/pipeline-stages";
import { FollowupsCard } from "@/components/dashboard/followups-card";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [leads, quotes, activities] = await Promise.all([
    listLeads(supabase),
    listQuotes(supabase),
    listActivities(supabase),
  ]);

  const stats = computeDashboardStats(leads, quotes, activities);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {!isSupabaseConfigured && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Demo mode — showing sample data. Connect Supabase to store real data (see README).
        </div>
      )}

      <h1 className="mb-1 text-xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
        Your pipeline at a glance.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Revenue (mtd)"
          value={formatCurrency(stats.revenueThisMonth)}
          icon={DollarSign}
          accent="emerald"
        />
        <StatCard
          label="Quotes sent (mtd)"
          value={String(stats.quotesSentThisMonth)}
          icon={FileText}
          accent="sky"
        />
        <StatCard
          label="Win rate"
          value={formatPercent(stats.winRate)}
          icon={Target}
          accent="violet"
        />
        <StatCard
          label="Follow-ups due"
          value={String(stats.followUpsDue)}
          icon={PhoneCall}
          accent="orange"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PipelineStages stages={stats.pipelineByStage} />
        <FollowupsCard activities={activities} leads={leads} />
      </div>
    </div>
  );
}
