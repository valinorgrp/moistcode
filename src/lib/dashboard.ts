import { LEAD_STAGES, type Activity, type Lead, type Quote } from "@/types/crm";

export interface PipelineStageSummary {
  status: Lead["status"];
  label: string;
  count: number;
  value: number;
}

export interface DashboardStats {
  revenueThisMonth: number;
  quotesSentThisMonth: number;
  winRate: number;
  wonCount: number;
  lostCount: number;
  followUpsDue: number;
  pipelineByStage: PipelineStageSummary[];
  openPipelineValue: number;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function computeDashboardStats(
  leads: Lead[],
  quotes: Quote[],
  activities: Activity[],
): DashboardStats {
  const monthStart = startOfMonth();
  const now = new Date();

  const revenueThisMonth = leads
    .filter((l) => l.status === "won" && new Date(l.updated_at) >= monthStart)
    .reduce((sum, l) => sum + Number(l.value), 0);

  const quotesSentThisMonth = quotes.filter(
    (q) => q.sent_at && new Date(q.sent_at) >= monthStart,
  ).length;

  const wonCount = leads.filter((l) => l.status === "won").length;
  const lostCount = leads.filter((l) => l.status === "lost").length;
  const decided = wonCount + lostCount;
  const winRate = decided === 0 ? 0 : wonCount / decided;

  const followUpsDue = activities.filter(
    (a) => !a.completed_at && a.due_at && new Date(a.due_at) <= now,
  ).length;

  const pipelineByStage: PipelineStageSummary[] = LEAD_STAGES.map((stage) => {
    const stageLeads = leads.filter((l) => l.status === stage.value);
    return {
      status: stage.value,
      label: stage.label,
      count: stageLeads.length,
      value: stageLeads.reduce((sum, l) => sum + Number(l.value), 0),
    };
  });

  const openPipelineValue = pipelineByStage
    .filter((s) => s.status !== "won" && s.status !== "lost")
    .reduce((sum, s) => sum + s.value, 0);

  return {
    revenueThisMonth,
    quotesSentThisMonth,
    winRate,
    wonCount,
    lostCount,
    followUpsDue,
    pipelineByStage,
    openPipelineValue,
  };
}
