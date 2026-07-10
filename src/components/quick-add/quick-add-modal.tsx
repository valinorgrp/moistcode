"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "@/components/ui/sheet";
import { LeadForm } from "./lead-form";
import { QuoteForm } from "./quote-form";
import { ActivityForm } from "./activity-form";
import type { EntityKind } from "./types";

const TABS: { value: EntityKind; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "quote", label: "Quote" },
  { value: "activity", label: "Activity" },
];

export function QuickAddModal({
  open,
  initialTab,
  onClose,
}: {
  open: boolean;
  initialTab: EntityKind;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<EntityKind>(initialTab);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Quick add"
      key={open ? initialTab : "closed"}
    >
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm font-medium transition",
              tab === t.value
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "lead" && <LeadForm onSaved={onClose} />}
      {tab === "quote" && <QuoteForm onSaved={onClose} />}
      {tab === "activity" && <ActivityForm onSaved={onClose} />}
    </Sheet>
  );
}
