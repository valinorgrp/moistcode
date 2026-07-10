"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { dateKey, getMonthGrid, WEEKDAY_LABELS } from "@/lib/calendar";
import { Sheet } from "@/components/ui/sheet";
import { ActivityRow } from "@/components/activities/activity-row";
import { ActivityIcon } from "@/components/activities/activity-icon";
import { useQuickAdd } from "@/components/quick-add/quick-add-context";
import type { Activity, Lead } from "@/types/crm";

const MAX_CHIPS_PER_DAY = 3;

export function CalendarView({ activities, leads }: { activities: Activity[]; leads: Lead[] }) {
  const today = useMemo(() => new Date(), []);
  const [monthDate, setMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);

  const byDay = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of activities) {
      if (!a.due_at) continue;
      const key = dateKey(new Date(a.due_at));
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.due_at! < b.due_at! ? -1 : 1));
    }
    return map;
  }, [activities]);

  const grid = useMemo(() => getMonthGrid(monthDate), [monthDate]);
  const todayKey = dateKey(today);
  const monthLabel = monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const { open } = useQuickAdd();

  function goToMonth(delta: number) {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  function addForDay(day: Date) {
    const dueAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0);
    open("activity", { dueAt: toLocalDatetimeValue(dueAt) });
  }

  const selectedActivities = selectedDay ? (byDay.get(dateKey(selectedDay)) ?? []) : [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => goToMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{monthLabel}</h2>
          <button
            onClick={() => setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="rounded-full border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Today
          </button>
        </div>
        <button
          onClick={() => goToMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-7 border-b border-slate-100 text-center text-[11px] font-medium text-slate-400 dark:border-slate-800">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="py-2">
              {w[0]}
              <span className="hidden sm:inline">{w.slice(1)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((day, i) => {
            const key = dateKey(day);
            const inMonth = day.getMonth() === monthDate.getMonth();
            const isToday = key === todayKey;
            const dayActivities = byDay.get(key) ?? [];
            const overflow = dayActivities.length - MAX_CHIPS_PER_DAY;

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "flex min-h-[64px] flex-col items-stretch gap-0.5 border-b border-r border-slate-100 p-1 text-left align-top transition hover:bg-slate-50 sm:min-h-[92px] sm:p-1.5 dark:border-slate-800 dark:hover:bg-slate-800/60",
                  i % 7 === 6 && "border-r-0",
                  !inMonth && "bg-slate-50/60 dark:bg-slate-950/40",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium sm:h-6 sm:w-6 sm:text-xs",
                    isToday
                      ? "bg-orange-500 text-white"
                      : inMonth
                        ? "text-slate-700 dark:text-slate-200"
                        : "text-slate-300 dark:text-slate-700",
                  )}
                >
                  {day.getDate()}
                </span>
                <div className="flex flex-col gap-0.5">
                  {dayActivities.slice(0, MAX_CHIPS_PER_DAY).map((a) => (
                    <span
                      key={a.id}
                      className={cn(
                        "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] leading-tight sm:text-[11px]",
                        a.completed_at
                          ? "bg-slate-100 text-slate-400 line-through dark:bg-slate-800 dark:text-slate-500"
                          : "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
                      )}
                    >
                      <ActivityIcon type={a.type} size={10} />
                      <span className="truncate">{a.subject}</span>
                    </span>
                  ))}
                  {overflow > 0 && (
                    <span className="px-1 text-[10px] text-slate-400">+{overflow} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Sheet
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) ?? ""}
      >
        <div className="mb-3">
          <button
            onClick={() => selectedDay && addForDay(selectedDay)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            <Plus size={16} /> Add for this day
          </button>
        </div>
        {selectedActivities.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Nothing scheduled.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {selectedActivities.map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                leadLabel={a.lead_id ? leadById.get(a.lead_id)?.name : undefined}
              />
            ))}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function toLocalDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
