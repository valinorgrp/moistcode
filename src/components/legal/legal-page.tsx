import Link from "next/link";
import type { ReactNode } from "react";

export const CONTACT_EMAIL = "phil@valinorgrpllc.com";

/** Shared shell for the Privacy and Terms pages (public, no sign-in needed). */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <main className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-medium text-orange-700 hover:underline dark:text-orange-400">
          ← Pipeline
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Last updated: {updated}</p>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 [&_a]:font-medium [&_a]:text-orange-700 [&_a]:underline dark:[&_a]:text-orange-400 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
          {children}
        </div>
        <p className="mt-10 text-sm text-slate-600 dark:text-slate-400">
          <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · Valinor Group LLC, Pennsylvania, USA
        </p>
      </main>
    </div>
  );
}
