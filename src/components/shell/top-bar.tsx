"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, MessageCircleMore, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function TopBar({ onOpenChat }: { onOpenChat: () => void }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white">
          <Sparkles size={14} />
        </div>
        <span className="font-semibold text-slate-900 dark:text-white">Pipeline</span>
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenChat}
          className="flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600"
        >
          <MessageCircleMore size={16} />
          <span className="hidden sm:inline">Quick chat</span>
        </button>

        {isSupabaseConfigured && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <LogOut size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
