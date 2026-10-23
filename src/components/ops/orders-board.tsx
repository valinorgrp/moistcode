"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { createJob, createOrder, deleteOrder, updateOrder } from "@/lib/data/ops";
import {
  ORDER_FILTERS,
  filterOrders,
  isOrderPastDue,
  nextNumber,
  orderBalance,
  orderTotals,
  roleCanEditRecords,
  roleCanManageTeam,
  type OrderFilter,
} from "@/lib/ops";
import { ORDER_STATUSES, TEAM_ROLES, type Job, type Lead, type Order, type OrderStatus, type Quote, type Workspace } from "@/types/crm";
import { Sheet } from "@/components/ui/sheet";
import { Field, inputClass } from "@/components/ui/field";
import {
  Chip,
  EmptyState,
  ORDER_STATUS_STYLE,
  PageHeader,
  RoleBadge,
  Toast,
  dangerButton,
  primaryButton,
  secondaryButton,
  sectionLabel,
  useSave,
  useToday,
} from "./shared";

function compactMoney(n: number) {
  return n >= 10_000 ? `$${(n / 1000).toFixed(1)}k` : formatCurrency(Math.round(n));
}

function shortDate(d: string | null) {
  return d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
}

type SheetState = { mode: "new" } | { mode: "edit"; order: Order } | null;

export function OrdersBoard({
  workspace,
  orders,
  jobs,
  quotes,
  leads,
}: {
  workspace: Workspace;
  orders: Order[];
  jobs: Job[];
  quotes: Quote[];
  leads: Lead[];
}) {
  const today = useToday() ?? "0000-00-00";
  const [filter, setFilter] = useState<OrderFilter>("todo");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState<SheetState>(null);
  const { save, pending, toast } = useSave();

  const canEdit = roleCanEditRecords(workspace.myRole);
  const list = filterOrders(orders, filter, today);
  const totals = orderTotals(list);
  const pastDueCount = orders.filter((o) => isOrderPastDue(o, today)).length;
  const quoteById = new Map(quotes.map((q) => [q.id, q]));
  const roleLabel = TEAM_ROLES.find((r) => r.value === workspace.myRole)?.label ?? workspace.myRole;

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function markSelectedDelivered() {
    const ids = [...selected];
    save(
      async () => {
        for (const id of ids) await updateOrder(createClient(), id, { status: "delivered" });
      },
      `${ids.length} marked delivered`,
      () => setSelected(new Set()),
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <PageHeader
        title="Orders"
        subtitle={`${ORDER_FILTERS.find((f) => f.value === filter)?.label} · ${list.length} ${list.length === 1 ? "order" : "orders"}`}
        right={<RoleBadge role={roleLabel} />}
      />

      <div className="mb-3 grid grid-cols-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        {[
          ["Total", totals.total, ""],
          ["Paid", totals.paid, ""],
          ["Owed", totals.owed, "text-red-600 dark:text-red-400"],
        ].map(([label, value, cls]) => (
          <div key={label as string}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            <p className={cn("mt-0.5 text-lg font-bold tabular-nums text-slate-900 dark:text-white", cls as string)}>
              {compactMoney(value as number)}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter orders">
        {ORDER_FILTERS.map((f) => (
          <Chip
            key={f.value}
            active={filter === f.value}
            onClick={() => {
              setFilter(f.value);
              setSelected(new Set());
            }}
          >
            {f.label}
            {f.value === "past_due" && pastDueCount > 0 ? ` · ${pastDueCount}` : ""}
          </Chip>
        ))}
      </div>

      {canEdit && (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setSheet({ mode: "new" })}
            className="flex items-center gap-1 py-1 text-sm font-semibold text-orange-600 dark:text-orange-400"
          >
            <Plus size={16} /> Add order
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState title="No orders here">
          {orders.length ? "Try another filter." : canEdit ? "Add your first order, or convert an accepted quote." : "Nothing yet."}
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {list.map((o) => {
            const sel = selected.has(o.id);
            const bal = orderBalance(o);
            const pill = isOrderPastDue(o, today) ? ORDER_STATUS_STYLE.past_due : ORDER_STATUS_STYLE[o.status];
            const jobCount = jobs.filter((j) => j.order_id === o.id).length;
            const quote = o.quote_id ? quoteById.get(o.quote_id) : undefined;
            return (
              <li
                key={o.id}
                className={cn(
                  "flex gap-3 rounded-2xl border bg-white p-3.5 dark:bg-slate-900",
                  sel ? "border-orange-500 bg-orange-50/60 dark:bg-orange-500/10" : "border-slate-200 dark:border-slate-800",
                )}
              >
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => toggle(o.id)}
                    aria-label={`Select ${o.order_number ?? o.customer}`}
                    aria-pressed={sel}
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2",
                      sel ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300 dark:border-slate-600",
                    )}
                  >
                    {sel && <Check size={14} strokeWidth={3} />}
                  </button>
                )}
                <button type="button" onClick={() => setSheet({ mode: "edit", order: o })} className="min-w-0 flex-1 text-left">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-slate-900 dark:text-white">{o.customer}</span>
                    {bal > 0 ? (
                      <span className="shrink-0 font-bold tabular-nums text-red-600 dark:text-red-400">{formatCurrency(bal)}</span>
                    ) : (
                      <span className="shrink-0 text-sm text-slate-500">Paid ✓</span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">{o.order_number ?? "—"}</span>
                    {quote?.quote_number ? (
                      <>
                        {" "}
                        · from <span className="text-blue-600 dark:text-blue-400">{quote.quote_number}</span>
                      </>
                    ) : null}{" "}
                    · due {shortDate(o.due_date)} · {jobCount ? `${jobCount} ${jobCount === 1 ? "job" : "jobs"}` : "no job yet"}
                  </span>
                  <span className="mt-2 flex items-center justify-between gap-2">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", pill.pill)}>{pill.label}</span>
                    <span className="text-xs tabular-nums text-slate-500">
                      Paid {formatCurrency(Number(o.paid))} of {formatCurrency(Number(o.total))}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4 md:bottom-6">
          <div className="mx-auto flex max-w-xl items-center gap-2 rounded-2xl bg-orange-500 py-2 pl-4 pr-2 text-sm font-bold text-white shadow-xl">
            {selected.size} selected
            <button
              type="button"
              disabled={pending}
              onClick={markSelectedDelivered}
              className="ml-auto rounded-xl bg-white/20 px-3 py-2 font-semibold"
            >
              Mark delivered
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className="rounded-xl bg-white/20 px-3 py-2 font-semibold">
              Cancel
            </button>
          </div>
        </div>
      )}

      <Sheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet?.mode === "edit" ? sheet.order.customer : "New order"}
      >
        {sheet?.mode === "new" && (
          <NewOrderForm
            quotes={quotes}
            leads={leads}
            pending={pending}
            onSubmit={(input) =>
              save(
                () =>
                  createOrder(createClient(), {
                    ...input,
                    order_number: nextNumber(
                      orders.map((o) => o.order_number),
                      "O",
                    ),
                  }),
                "Order added",
                () => setSheet(null),
              )
            }
            defaultDue={today}
          />
        )}
        {sheet?.mode === "edit" && (
          <OrderDetail
            key={sheet.order.id}
            order={sheet.order}
            quote={sheet.order.quote_id ? quoteById.get(sheet.order.quote_id) : undefined}
            canEdit={canEdit}
            canDelete={roleCanManageTeam(workspace.myRole)}
            pending={pending}
            onPay={(amount) =>
              save(
                () =>
                  updateOrder(createClient(), sheet.order.id, {
                    paid: Math.min(Number(sheet.order.total), Number(sheet.order.paid) + amount),
                  }),
                `${formatCurrency(amount)} recorded`,
                () => setSheet(null),
              )
            }
            onStatus={(status) =>
              save(
                () => updateOrder(createClient(), sheet.order.id, { status }),
                `Marked ${ORDER_STATUS_STYLE[status].label.toLowerCase()}`,
                () => setSheet(null),
              )
            }
            onCreateJob={() => {
              const number = nextNumber(
                jobs.map((j) => j.job_number),
                "J",
              );
              return save(
                () =>
                  createJob(createClient(), {
                    job_number: number,
                    order_id: sheet.order.id,
                    lead_id: sheet.order.lead_id,
                    customer: sheet.order.customer,
                    title: `For ${sheet.order.order_number ?? "order"}`,
                    tech_id: null,
                    scheduled_date: null,
                    start_time: null,
                    duration_hours: 2,
                    status: "scheduled",
                    notes: null,
                  }),
                `${number} added to Dispatch, unscheduled`,
                () => setSheet(null),
              );
            }}
            onDelete={() => save(() => deleteOrder(createClient(), sheet.order.id), "Order deleted", () => setSheet(null))}
          />
        )}
      </Sheet>
      <Toast toast={toast} />
    </div>
  );
}

function OrderDetail({
  order,
  quote,
  canEdit,
  canDelete,
  pending,
  onPay,
  onStatus,
  onCreateJob,
  onDelete,
}: {
  order: Order;
  quote?: Quote;
  canEdit: boolean;
  canDelete: boolean;
  pending: boolean;
  onPay: (amount: number) => void;
  onStatus: (s: OrderStatus) => void;
  onCreateJob: () => void;
  onDelete: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bal = orderBalance(order);

  return (
    <div className="space-y-5">
      <p className="-mt-1 text-sm text-slate-500 dark:text-slate-400">
        {order.order_number}
        {quote?.quote_number ? ` · from ${quote.quote_number}` : ""} · {formatCurrency(Number(order.total))} total ·{" "}
        <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(bal)} owed</span>
      </p>

      {canEdit ? (
        <>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(amount);
              if (n > 0) onPay(n);
            }}
          >
            <Field label="Record a payment">
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                min={0.01}
                step="0.01"
                placeholder={bal ? String(bal) : "0"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <button className={primaryButton} disabled={pending || !bal || !(Number(amount) > 0)}>
              Record payment
            </button>
          </form>

          <section>
            <h3 className={sectionLabel}>Status</h3>
            <div className="grid grid-cols-3 gap-2">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  disabled={pending}
                  onClick={() => onStatus(s.value)}
                  aria-pressed={order.status === s.value}
                  className={cn(
                    "rounded-xl px-2 py-3 text-sm font-semibold disabled:opacity-50",
                    ORDER_STATUS_STYLE[s.value].pill,
                    order.status === s.value && "ring-2 ring-slate-900/20 dark:ring-white/30",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          <button type="button" className={secondaryButton} disabled={pending} onClick={onCreateJob}>
            Create a job for this order
          </button>
        </>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">Your role can view orders but not change them.</p>
      )}

      {canDelete && (
        <button
          type="button"
          className={dangerButton}
          disabled={pending}
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
        >
          {confirmDelete ? "Tap again to delete" : "Delete order"}
        </button>
      )}
    </div>
  );
}

function NewOrderForm({
  quotes,
  leads,
  pending,
  onSubmit,
  defaultDue,
}: {
  quotes: Quote[];
  leads: Lead[];
  pending: boolean;
  onSubmit: (input: Omit<Parameters<typeof createOrder>[1], "order_number">) => void;
  defaultDue: string;
}) {
  const accepted = quotes.filter((q) => q.status === "accepted" || q.status === "sent");
  const [quoteId, setQuoteId] = useState("");
  const [customer, setCustomer] = useState("");
  const [total, setTotal] = useState("");
  const [paid, setPaid] = useState("0");
  const [due, setDue] = useState(defaultDue === "0000-00-00" ? "" : defaultDue);
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!customer.trim() || !(Number(total) >= 0) || total === "") {
          return setError("Add the customer and the order total.");
        }
        const q = quotes.find((x) => x.id === quoteId);
        onSubmit({
          customer: customer.trim(),
          quote_id: quoteId || null,
          lead_id: q?.lead_id ?? null,
          due_date: due || null,
          status: "confirmed",
          total: Number(total),
          paid: Math.min(Number(paid) || 0, Number(total)),
          notes: null,
        });
      }}
    >
      {accepted.length > 0 && (
        <Field label="From quote (optional)">
          <select
            className={inputClass}
            value={quoteId}
            onChange={(e) => {
              setQuoteId(e.target.value);
              const q = quotes.find((x) => x.id === e.target.value);
              if (q && !total) setTotal(String(q.amount));
              const lead = q?.lead_id ? leads.find((l) => l.id === q.lead_id) : undefined;
              if (lead && !customer) setCustomer(lead.company || lead.name);
            }}
          >
            <option value="">No quote</option>
            {accepted.map((q) => (
              <option key={q.id} value={q.id}>
                {q.quote_number ?? "Untitled"} · {(() => {
                  const l = q.lead_id ? leads.find((x) => x.id === q.lead_id) : undefined;
                  return l ? `${l.company || l.name} · ` : "";
                })()}
                {formatCurrency(Number(q.amount))} · {q.status}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Customer">
        <input className={inputClass} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="e.g. Hatfield Diner" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Total ($)">
          <input className={inputClass} type="number" min={0} step="0.01" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} />
        </Field>
        <Field label="Paid so far ($)">
          <input className={inputClass} type="number" min={0} step="0.01" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} />
        </Field>
      </div>
      <Field label="Due">
        <input className={inputClass} type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className={primaryButton} disabled={pending}>
        Add order
      </button>
    </form>
  );
}
