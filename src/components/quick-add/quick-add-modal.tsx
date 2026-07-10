"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "@/components/ui/sheet";
import { LeadForm } from "./lead-form";
import { QuoteForm } from "./quote-form";
import { ActivityForm } from "./activity-form";
import type { QuickAddDefaults } from "./quick-add-context";
import type { EntityKind } from "./types";

const TABS: { value: EntityKind; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "quote", label: "Quote" },
  { value: "activity", label: "Activity" },
];

export function QuickAddModal({
  open,
  initialTab,
  defaults,
  onClose,
}: {
  open: boolean;
  initialTab: EntityKind;
  defaults?: QuickAddDefaults;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Quick add" key={open ? initialTab : "closed"}>
      <QuickAddBody initialTab={initialTab} defaults={defaults} onClose={onClose} />
    </Sheet>
  );
}

/**
 * Split out so its `tab` state resets whenever the caller asks for a
 * different entity: the parent `Sheet` above remounts this component (via
 * its `key`) each time the modal reopens with a new `initialTab`, so a
 * fresh `useState(initialTab)` is all that's needed here — no effect to
 * sync it after the fact.
 */
function QuickAddBody({
  initialTab,
  defaults,
  onClose,
}: {
  initialTab: EntityKind;
  defaults?: QuickAddDefaults;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<EntityKind>(initialTab);

  return (
    <>
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
      {tab === "activity" && (
        <ActivityForm onSaved={onClose} defaultDueAt={defaults?.dueAt} />
      )}
    </>
  );
}
