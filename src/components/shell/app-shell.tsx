"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { QuickAddContext, type QuickAddDefaults } from "@/components/quick-add/quick-add-context";
import { QuickAddModal } from "@/components/quick-add/quick-add-modal";
import type { EntityKind } from "@/components/quick-add/types";
import { ChatDrawer } from "@/components/ai-chat/chat-drawer";
import { BottomNav } from "./bottom-nav";
import { SideNav } from "./side-nav";
import { TopBar } from "./top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState<EntityKind>("lead");
  const [quickAddDefaults, setQuickAddDefaults] = useState<QuickAddDefaults>({});
  const [chatOpen, setChatOpen] = useState(false);

  function openQuickAdd(kind: EntityKind = "lead", defaults: QuickAddDefaults = {}) {
    setQuickAddTab(kind);
    setQuickAddDefaults(defaults);
    setQuickAddOpen(true);
  }

  return (
    <QuickAddContext.Provider value={{ open: openQuickAdd }}>
      <div className="flex min-h-dvh">
        <SideNav />
        <div className="flex min-w-0 min-h-dvh flex-1 flex-col">
          <TopBar onOpenChat={() => setChatOpen(true)} />
          <main className="min-w-0 flex-1 pb-24 md:pb-8">{children}</main>
        </div>
      </div>

      <BottomNav />

      <button
        onClick={() => openQuickAdd("lead")}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition hover:bg-orange-600 md:bottom-8 md:right-8"
        aria-label="Quick add"
      >
        <Plus size={26} />
      </button>

      <QuickAddModal
        open={quickAddOpen}
        initialTab={quickAddTab}
        defaults={quickAddDefaults}
        onClose={() => setQuickAddOpen(false)}
      />
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </QuickAddContext.Provider>
  );
}
