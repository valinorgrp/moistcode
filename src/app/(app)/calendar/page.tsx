import { createClient } from "@/lib/supabase/server";
import { listActivities } from "@/lib/data/activities";
import { listLeads } from "@/lib/data/leads";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const supabase = await createClient();
  const [activities, leads] = await Promise.all([listActivities(supabase), listLeads(supabase)]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Calendar</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Calls, meetings, and follow-ups by date.
        </p>
      </div>
      <CalendarView activities={activities} leads={leads} />
    </div>
  );
}
