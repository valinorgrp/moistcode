import { createClient } from "@/lib/supabase/server";
import { getRolePermissions, getWorkspace, listAudit, listTeam } from "@/lib/data/ops";
import { TeamBoard } from "@/components/ops/team-board";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const supabase = await createClient();
  const workspace = await getWorkspace(supabase);
  const [team, permissions, audit] = await Promise.all([
    listTeam(supabase),
    getRolePermissions(supabase),
    listAudit(supabase, 25),
  ]);
  return <TeamBoard workspace={workspace} team={team} permissions={permissions} audit={audit} />;
}
