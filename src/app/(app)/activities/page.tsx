import { createClient } from "@/lib/supabase/server";
import { listActivities } from "@/lib/data/activities";
import { listLeads } from "@/lib/data/leads";
import { QuickAddButton } from "@/components/quick-add/quick-add-button";
import { ActivityRow } from "@/components/activities/activity-row";
import type { Activity } from "@/types/crm";

export default async function ActivitiesPage() {
  const supabase = await createClient();
  const [activities, leads] = await Promise.all([listActivities(supabase), listLeads(supabase)]);
  const leadById = new Map(leads.map((l) => [l.id, l]));

  const now = new Date();
  const pending = activities.filter((a) => !a.completed_at);
  const overdue = pending.filter((a) => a.due_at && new Date(a.due_at) < now);
  const upcoming = pending.filter((a) => !a.due_at || new Date(a.due_at) >= now);
  const completed = activities.filter((a) => a.completed_at);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Activity</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {pending.length} open follow-ups
          </p>
        </div>
        <QuickAddButton kind="activity" label="Log activity" />
      </div>

      <Section title="Overdue" activities={overdue} leadById={leadById} emphasize />
      <Section title="Upcoming" activities={upcoming} leadById={leadById} />
      <Section title="Completed" activities={completed} leadById={leadById} />
    </div>
  );
}

function Section({
  title,
  activities,
  leadById,
  emphasize,
}: {
  title: string;
  activities: Activity[];
  leadById: Map<string, { name: string }>;
  emphasize?: boolean;
}) {
  if (activities.length === 0) return null;
  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2
        className={`mb-1 text-sm font-semibold ${emphasize ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}
      >
        {title}
      </h2>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {activities.map((a) => (
          <ActivityRow
            key={a.id}
            activity={a}
            leadLabel={a.lead_id ? leadById.get(a.lead_id)?.name : undefined}
          />
        ))}
      </div>
    </div>
  );
}
