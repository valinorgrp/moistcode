"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { QuickAddContext, type QuickAddDefaults } from "@/components/quick-add/quick-add-context";
import dynamic from "next/dynamic";
import type { EntityKind } from "@/components/quick-add/types";
import { BottomNav } from "./bottom-nav";
import { SideNav } from "./side-nav";
import { TopBar } from "./top-bar";

// The quick-add forms and the AI chat only open on tap, so their code (and
// its form/validation libraries) loads on first use instead of with every page.
const QuickAddModal = dynamic(() => import("@/components/quick-add/quick-add-modal").then((m) => m.QuickAddModal), {
  ssr: false,
});
const ChatDrawer = dynamic(() => import("@/components/ai-chat/chat-drawer").then((m) => m.ChatDrawer), {
  ssr: false,
});

export function AppShell({ children }: { children: React.ReactNode }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState<EntityKind>("lead");
  const [quickAddDefaults, setQuickAddDefaults] = useState<QuickAddDefaults>({});
  const [chatOpen, setChatOpen] = useState(false);
  // Load each panel's code on first open, then keep it mounted so the chat
  // keeps its conversation between opens (as before).
  const [quickAddLoaded, setQuickAddLoaded] = useState(false);
  const [chatLoaded, setChatLoaded] = useState(false);

  function openQuickAdd(kind: EntityKind = "lead", defaults: QuickAddDefaults = {}) {
    setQuickAddTab(kind);
    setQuickAddDefaults(defaults);
    setQuickAddOpen(true);
    setQuickAddLoaded(true);
  }

  function openChat() {
    setChatOpen(true);
    setChatLoaded(true);
  }

  return (
    <QuickAddContext.Provider value={{ open: openQuickAdd }}>
      <div className="flex min-h-dvh">
        <SideNav />
        <div className="flex min-w-0 min-h-dvh flex-1 flex-col">
          <TopBar onOpenChat={openChat} />
          <main className="min-w-0 flex-1 pb-24 md:pb-8">{children}</main>
        </div>
      </div>

      <BottomNav />

      <button
        onClick={() => openQuickAdd("lead")}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-orange-700 text-white shadow-lg transition hover:bg-orange-800 md:bottom-8 md:right-8"
        aria-label="Quick add"
      >
        <Plus size={26} />
      </button>

      {quickAddLoaded && (
        <QuickAddModal
          open={quickAddOpen}
          initialTab={quickAddTab}
          defaults={quickAddDefaults}
          onClose={() => setQuickAddOpen(false)}
        />
      )}
      {chatLoaded && <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />}
    </QuickAddContext.Provider>
  );
}
