import { createClient } from "@/lib/supabase/server";
import { getWorkspace, listJobs, listOrders } from "@/lib/data/ops";
import { listQuotes } from "@/lib/data/quotes";
import { listLeads } from "@/lib/data/leads";
import { OrdersBoard } from "@/components/ops/orders-board";

export default async function OrdersPage() {
  const supabase = await createClient();
  const workspace = await getWorkspace(supabase);
  const [orders, jobs, quotes, leads] = await Promise.all([
    listOrders(supabase),
    listJobs(supabase),
    listQuotes(supabase),
    listLeads(supabase),
  ]);
  return <OrdersBoard workspace={workspace} orders={orders} jobs={jobs} quotes={quotes} leads={leads} />;
}
