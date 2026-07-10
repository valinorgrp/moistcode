import Link from "next/link";
import type { Activity, Lead } from "@/types/crm";
import { ActivityRow } from "@/components/activities/activity-row";

export function FollowupsCard({ activities, leads }: { activities: Activity[]; leads: Lead[] }) {
  const due = activities
    .filter((a) => !a.completed_at && a.due_at)
    .sort((a, b) => (a.due_at! < b.due_at! ? -1 : 1))
    .slice(0, 6);

  const leadById = new Map(leads.map((l) => [l.id, l]));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Follow-ups</h2>
        <Link href="/activities" className="text-xs font-medium text-orange-600 hover:underline">
          View all
        </Link>
      </div>
      {due.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">You&apos;re all caught up.</p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {due.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              leadLabel={activity.lead_id ? leadById.get(activity.lead_id)?.name : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
