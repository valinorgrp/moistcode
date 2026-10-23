"use client";

import { useCallback, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { initials, toDateKey } from "@/lib/ops";
import { friendlyError } from "@/lib/data/ops";
import type { JobStatus, OrderStatus, TeamMember } from "@/types/crm";

// ---------------------------------------------------------------------------
// Status colors — one system used by every ops screen. Always paired with a
// text label so color is never the only signal.
// ---------------------------------------------------------------------------

export const JOB_STATUS_STYLE: Record<JobStatus, { card: string; dot: string; label: string }> = {
  done: {
    card: "border-l-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100",
    dot: "bg-emerald-500",
    label: "Done",
  },
  in_progress: {
    card: "border-l-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100",
    dot: "bg-amber-500",
    label: "In progress",
  },
  scheduled: {
    card: "border-l-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-100",
    dot: "bg-blue-500",
    label: "Scheduled",
  },
  late: {
    card: "border-l-red-500 bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-100",
    dot: "bg-red-500",
    label: "Running late",
  },
};

export const ORDER_STATUS_STYLE: Record<OrderStatus | "past_due", { pill: string; label: string }> = {
  confirmed: { pill: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200", label: "Confirmed" },
  in_progress: { pill: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200", label: "In progress" },
  delivered: { pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200", label: "Delivered" },
  past_due: { pill: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200", label: "Past due" },
};

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

export function MemberAvatar({
  member,
  size = 40,
  dotClass,
  className,
}: {
  member: Pick<TeamMember, "name" | "color"> | null | undefined;
  size?: number;
  dotClass?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.32, background: member?.color ?? "#64748b" }}
      aria-hidden
    >
      {initials(member?.name)}
      {dotClass && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-950",
            dotClass,
          )}
        />
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// The phone's clock. Read on the client only: the server runs in UTC, which
// is already "tomorrow" on an East Coast evening.
// ---------------------------------------------------------------------------

function subscribeMinute(onChange: () => void) {
  const t = setInterval(onChange, 30_000);
  return () => clearInterval(t);
}

/**
 * Today's date (YYYY-MM-DD) on this device. During server render and
 * hydration it returns `serverValue` (the business's time zone, computed by
 * the page) so the schedule arrives filled in; the phone's own clock takes
 * over right after.
 */
export function useToday(serverValue: string | null = null): string | null {
  return useSyncExternalStore(
    subscribeMinute,
    () => toDateKey(new Date()),
    () => serverValue,
  );
}

/** Minutes after midnight on this device, updated every 30s. Same server fallback as useToday. */
export function useNowMinutes(serverValue: number | null = null): number | null {
  return useSyncExternalStore(
    subscribeMinute,
    () => {
      const d = new Date();
      return d.getHours() * 60 + d.getMinutes();
    },
    () => serverValue,
  );
}

// ---------------------------------------------------------------------------
// Saving: run a write, show a short confirmation, refresh the server data.
// ---------------------------------------------------------------------------

export function useSave() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const flash = useCallback((text: string, error = false) => {
    setToast({ text, error });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const save = useCallback(
    (fn: () => Promise<unknown>, done?: string, after?: () => void) =>
      new Promise<boolean>((resolve) => {
        startTransition(async () => {
          try {
            await fn();
            if (done) flash(done);
            after?.();
            router.refresh();
            resolve(true);
          } catch (err) {
            flash(friendlyError(err), true);
            resolve(false);
          }
        });
      }),
    [flash, router],
  );

  return { save, pending, toast, flash };
}

export function Toast({ toast }: { toast: { text: string; error?: boolean } | null }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-24 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg md:bottom-8",
        toast.error ? "bg-red-600 text-white" : "bg-slate-900 text-white dark:bg-white dark:text-slate-900",
      )}
    >
      {toast.text}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      Signed in as <b className="font-semibold text-orange-700 dark:text-orange-400">{role}</b>
    </span>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-2 text-sm transition",
        active
          ? "border-orange-500 bg-orange-700 font-semibold text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
      )}
    >
      {children}
    </button>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
      <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {children && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{children}</p>}
    </div>
  );
}

export const primaryButton =
  "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-700 text-sm font-semibold text-white transition hover:bg-orange-800 disabled:opacity-50";
export const secondaryButton =
  "flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
export const dangerButton =
  "flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950";

export const sectionLabel =
  "mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400";
