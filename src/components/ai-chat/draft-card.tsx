"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Field, inputClass } from "@/components/ui/field";
import { LEAD_STAGES } from "@/types/crm";
import type { Lead } from "@/types/crm";
import type { ParsedDraft } from "./types";

export function DraftCard({
  draft,
  leads,
  matchedLeadId,
  onConfirm,
  onCancel,
}: {
  draft: ParsedDraft;
  leads: Lead[];
  matchedLeadId: string | null;
  onConfirm: (draft: ParsedDraft, leadId: string | null) => void;
  onCancel: () => void;
}) {
  const [current, setCurrent] = useState(draft);
  const [leadId, setLeadId] = useState<string>(matchedLeadId ?? "");
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    await onConfirm(current, leadId || null);
    setSaving(false);
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-orange-600">
        {current.entity === "lead" && "New lead"}
        {current.entity === "quote" && "New quote"}
        {current.entity === "activity" && "New activity"}
      </p>

      <div className="space-y-3">
        {current.entity === "lead" && (
          <>
            <Field label="Name">
              <input
                className={inputClass}
                value={current.fields.name}
                onChange={(e) =>
                  setCurrent({ ...current, fields: { ...current.fields, name: e.target.value } })
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company">
                <input
                  className={inputClass}
                  value={current.fields.company ?? ""}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      fields: { ...current.fields, company: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Value">
                <input
                  type="number"
                  className={inputClass}
                  value={current.fields.value ?? 0}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      fields: { ...current.fields, value: Number(e.target.value) },
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Stage">
              <select
                className={inputClass}
                value={current.fields.status ?? "new"}
                onChange={(e) =>
                  setCurrent({
                    ...current,
                    fields: { ...current.fields, status: e.target.value as never },
                  })
                }
              >
                {LEAD_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        {current.entity !== "lead" && (
          <Field label="Lead / deal">
            <select className={inputClass} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              <option value="">— No lead —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.company ? `(${l.company})` : ""}
                </option>
              ))}
            </select>
          </Field>
        )}

        {current.entity === "quote" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <input
                type="number"
                className={inputClass}
                value={current.fields.amount ?? 0}
                onChange={(e) =>
                  setCurrent({
                    ...current,
                    fields: { ...current.fields, amount: Number(e.target.value) },
                  })
                }
              />
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                value={current.fields.status ?? "draft"}
                onChange={(e) =>
                  setCurrent({
                    ...current,
                    fields: { ...current.fields, status: e.target.value as never },
                  })
                }
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="expired">Expired</option>
              </select>
            </Field>
          </div>
        )}

        {current.entity === "activity" && (
          <>
            <Field label="Subject">
              <input
                className={inputClass}
                value={current.fields.subject}
                onChange={(e) =>
                  setCurrent({
                    ...current,
                    fields: { ...current.fields, subject: e.target.value },
                  })
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select
                  className={inputClass}
                  value={current.fields.type}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      fields: { ...current.fields, type: e.target.value as never },
                    })
                  }
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="task">Task</option>
                  <option value="note">Note</option>
                </select>
              </Field>
              <Field label="Due">
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={current.fields.due_at?.slice(0, 16) ?? ""}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      fields: { ...current.fields, due_at: e.target.value },
                    })
                  }
                />
              </Field>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onCancel}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <X size={15} /> Discard
        </button>
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          <Check size={15} /> {saving ? "Saving..." : "Confirm"}
        </button>
      </div>
    </div>
  );
}
