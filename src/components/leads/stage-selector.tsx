"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateLead } from "@/lib/data/leads";
import { LEAD_STAGES, type LeadStatus } from "@/types/crm";
import { inputClass } from "@/components/ui/field";

export function StageSelector({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(next: LeadStatus) {
    startTransition(async () => {
      await updateLead(createClient(), leadId, { status: next });
      router.refresh();
    });
  }

  return (
    <select
      className={inputClass}
      value={status}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value as LeadStatus)}
    >
      {LEAD_STAGES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
