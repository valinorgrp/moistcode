import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-700 text-white">
          <Compass size={22} aria-hidden />
        </div>
        <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">404</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          The link may be old, or the record may have been deleted.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-lg bg-orange-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-800"
          >
            Go to the dashboard
          </Link>
          <Link
            href="/dispatch"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Open Dispatch
          </Link>
        </div>
      </div>
    </main>
  );
}
