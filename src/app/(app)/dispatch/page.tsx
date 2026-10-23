import { createClient } from "@/lib/supabase/server";
import { getWorkspace, listJobs, listTeam } from "@/lib/data/ops";
import { DispatchBoard } from "@/components/ops/dispatch-board";

export default async function DispatchPage() {
  const supabase = await createClient();
  const workspace = await getWorkspace(supabase);
  const [team, jobs] = await Promise.all([listTeam(supabase), listJobs(supabase)]);
  return <DispatchBoard workspace={workspace} team={team} jobs={jobs} />;
}
