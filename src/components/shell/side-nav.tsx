"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_GROUPS, NAV_ITEMS, isActive } from "./nav-items";
import { Sparkles } from "lucide-react";

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-4 md:flex dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-700 text-white">
          <Sparkles size={16} />
        </div>
        <span className="text-base font-semibold text-slate-900 dark:text-white">Pipeline</span>
      </div>
      <nav className="flex flex-col gap-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.key} className="flex flex-col gap-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{group.label}</p>
            {NAV_ITEMS.filter((i) => i.group === group.key).map((item) => {
              const active = isActive(item.href, pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <p className="mt-auto px-3 pt-6 text-xs text-slate-600 dark:text-slate-400">
        <Link href="/terms" className="hover:underline">
          Terms
        </Link>
        {" · "}
        <Link href="/privacy" className="hover:underline">
          Privacy
        </Link>
      </p>
    </aside>
  );
}
