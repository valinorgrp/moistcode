"use client";

import { Plus } from "lucide-react";
import { useQuickAdd } from "./quick-add-context";
import type { EntityKind } from "./types";

export function QuickAddButton({ kind, label }: { kind: EntityKind; label: string }) {
  const { open } = useQuickAdd();
  return (
    <button
      onClick={() => open(kind)}
      className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-600"
    >
      <Plus size={16} />
      {label}
    </button>
  );
}
