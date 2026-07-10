"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { listLeads } from "@/lib/data/leads";
import { createLead } from "@/lib/data/leads";
import { createQuote } from "@/lib/data/quotes";
import { createActivity } from "@/lib/data/activities";
import type { Lead } from "@/types/crm";
import { DraftCard } from "./draft-card";
import { matchLead } from "./match-lead";
import type { ChatMessage, ParsedDraft } from "./types";

function uid() {
  return Math.random().toString(36).slice(2);
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  kind: "text",
  text: "Tell me about a lead, quote, or a call/meeting update and I'll draft it for your review — e.g. \"Just talked to Priya at Cascade, she wants a demo next Tuesday.\"",
};

export function ChatDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) listLeads(createClient()).then(setLeads);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!open) return null;

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { id: uid(), role: "user", kind: "text", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { id: uid(), role: "assistant", kind: "error", text: data.error ?? "Something went wrong." },
        ]);
        return;
      }

      const draft = data as ParsedDraft;
      const leadNameQuery =
        draft.entity !== "lead" ? draft.fields.lead_name : undefined;
      const matched = matchLead(leadNameQuery, leads);

      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", kind: "draft", draft, matchedLeadId: matched?.id ?? null },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", kind: "error", text: "Couldn't reach the AI service." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDraft(messageId: string, draft: ParsedDraft, leadId: string | null) {
    const supabase = createClient();

    if (draft.entity === "lead") {
      await createLead(supabase, {
        name: draft.fields.name,
        company: draft.fields.company || null,
        email: draft.fields.email || null,
        phone: draft.fields.phone || null,
        status: draft.fields.status ?? "new",
        value: draft.fields.value ?? 0,
        source: draft.fields.source || null,
        notes: draft.fields.notes || null,
      });
    } else if (draft.entity === "quote") {
      const isSent = (draft.fields.status ?? "draft") !== "draft";
      await createQuote(supabase, {
        lead_id: leadId,
        quote_number: null,
        amount: draft.fields.amount,
        status: draft.fields.status ?? "draft",
        sent_at: isSent ? new Date().toISOString() : null,
        valid_until: draft.fields.valid_until || null,
        notes: draft.fields.notes || null,
      });
    } else {
      await createActivity(supabase, {
        lead_id: leadId,
        type: draft.fields.type,
        subject: draft.fields.subject,
        notes: draft.fields.notes || null,
        due_at: draft.fields.due_at ? new Date(draft.fields.due_at).toISOString() : null,
        completed_at: null,
      });
    }

    router.refresh();
    setMessages((m) =>
      m.map((msg) =>
        msg.id === messageId
          ? { ...msg, kind: "saved" as const, text: "Saved to your CRM." }
          : msg,
      ),
    );
  }

  function handleCancelDraft(messageId: string) {
    setMessages((m) =>
      m.map((msg) =>
        msg.id === messageId ? { ...msg, kind: "text" as const, text: "Discarded." } : msg,
      ),
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-[85dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:h-[80dvh] sm:rounded-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white">
              <Sparkles size={14} />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Quick chat</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((msg) => (
            <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {msg.kind === "draft" && msg.draft ? (
                <DraftCard
                  draft={msg.draft}
                  leads={leads}
                  matchedLeadId={msg.matchedLeadId ?? null}
                  onConfirm={(draft, leadId) => handleConfirmDraft(msg.id, draft, leadId)}
                  onCancel={() => handleCancelDraft(msg.id)}
                />
              ) : (
                <div
                  className={
                    msg.role === "user"
                      ? "max-w-[80%] rounded-2xl rounded-br-sm bg-orange-500 px-3.5 py-2 text-sm text-white"
                      : msg.kind === "error"
                        ? "max-w-[80%] rounded-2xl rounded-bl-sm bg-red-50 px-3.5 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
                        : "max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  }
                >
                  {msg.text}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2 text-sm text-slate-400 dark:bg-slate-800">
                Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Just talked to..."
            className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
