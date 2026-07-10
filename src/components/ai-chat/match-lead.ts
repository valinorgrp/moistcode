import type { Lead } from "@/types/crm";

export function matchLead(query: string | undefined, leads: Lead[]): Lead | null {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const exact = leads.find(
    (l) => l.name.toLowerCase() === q || l.company?.toLowerCase() === q,
  );
  if (exact) return exact;

  const partial = leads.find(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      q.includes(l.name.toLowerCase()) ||
      (l.company && (l.company.toLowerCase().includes(q) || q.includes(l.company.toLowerCase()))),
  );
  return partial ?? null;
}
