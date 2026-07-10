"use client";

import { createContext, useContext } from "react";
import type { EntityKind } from "./types";

export interface QuickAddContextValue {
  open: (kind?: EntityKind) => void;
}

export const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd must be used within AppShell");
  return ctx;
}
