"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { MORE_ITEM, NAV_ITEMS, isActive } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const mobile = NAV_ITEMS.filter((i) => i.mobile);
  // "More" lights up for any page that isn't in the bar itself.
  const moreActive = !mobile.some((i) => isActive(i.href, pathname));
  const items = [...mobile.map((i) => ({ ...i, active: isActive(i.href, pathname) })), { ...MORE_ITEM, active: moreActive }];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden dark:border-slate-800 dark:bg-slate-950/95">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition",
              item.active ? "text-orange-700 dark:text-orange-400" : "text-slate-600 dark:text-slate-400",
            )}
          >
            <Icon size={20} strokeWidth={item.active ? 2.5 : 2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
