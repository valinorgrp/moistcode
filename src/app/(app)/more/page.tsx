import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NAV_GROUPS, NAV_ITEMS } from "@/components/shell/nav-items";

export default function MorePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">More</h1>
      <div className="space-y-5">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group.key && !i.mobile);
          if (!items.length) return null;
          return (
            <section key={group.key}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{group.label}</h2>
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        <Icon size={18} className="text-slate-500" />
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight size={16} className="text-slate-400" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
