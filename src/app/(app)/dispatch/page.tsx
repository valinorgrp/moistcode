import { createClient } from "@/lib/supabase/server";
import { getWorkspace, listJobs, listTeam } from "@/lib/data/ops";
import { DispatchBoard } from "@/components/ops/dispatch-board";
import { BUSINESS_TIME_ZONE, zonedNow } from "@/lib/ops";

export const metadata = { title: "Dispatch" };

export default async function DispatchPage() {
  const supabase = await createClient();
  const workspace = await getWorkspace(supabase);
  const [team, jobs] = await Promise.all([listTeam(supabase), listJobs(supabase)]);
  return <DispatchBoard workspace={workspace} team={team} jobs={jobs} serverNow={zonedNow(BUSINESS_TIME_ZONE)} />;
}
