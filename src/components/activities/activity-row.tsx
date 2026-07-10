"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { completeActivity } from "@/lib/data/activities";
import { cn } from "@/lib/cn";
import { formatRelativeDate } from "@/lib/format";
import type { Activity } from "@/types/crm";
import { ActivityIcon } from "./activity-icon";

export function ActivityRow({ activity, leadLabel }: { activity: Activity; leadLabel?: string }) {
  const router = useRouter();
  const [completed, setCompleted] = useState(Boolean(activity.completed_at));
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !completed;
    setCompleted(next);
    startTransition(async () => {
      await completeActivity(createClient(), activity.id, next);
      router.refresh();
    });
  }

  const overdue =
    !completed && activity.due_at && new Date(activity.due_at) < new Date();

  return (
    <div className="flex items-center gap-3 py-2.5">
      <button
        onClick={toggle}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
          completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-300 text-transparent hover:border-orange-400 dark:border-slate-600",
        )}
        aria-label="Toggle complete"
      >
        <Check size={13} />
      </button>

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <ActivityIcon type={activity.type} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            completed ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100",
          )}
        >
          {activity.subject}
        </p>
        {leadLabel && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{leadLabel}</p>
        )}
      </div>

      {activity.due_at && (
        <span
          className={cn(
            "shrink-0 text-xs font-medium",
            overdue ? "text-rose-500" : "text-slate-400",
          )}
        >
          {formatRelativeDate(activity.due_at)}
        </span>
      )}
    </div>
  );
}
