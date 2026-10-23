import {
  Activity,
  CalendarDays,
  Ellipsis,
  LayoutDashboard,
  Package,
  Receipt,
  Truck,
  Users,
  UsersRound,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof Users;
  /** Shown in the phone's bottom bar. Everything else lives under More. */
  mobile?: boolean;
  group: "sell" | "deliver" | "team";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, mobile: true, group: "sell" },
  { href: "/leads", label: "Pipeline", icon: Users, mobile: true, group: "sell" },
  { href: "/quotes", label: "Quotes", icon: Receipt, group: "sell" },
  { href: "/activities", label: "Activity", icon: Activity, group: "sell" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, group: "sell" },
  { href: "/dispatch", label: "Dispatch", icon: Truck, mobile: true, group: "deliver" },
  { href: "/orders", label: "Orders", icon: Package, mobile: true, group: "deliver" },
  { href: "/team", label: "Team", icon: UsersRound, group: "team" },
];

export const MORE_ITEM = { href: "/more", label: "More", icon: Ellipsis } as const;

export const NAV_GROUPS: { key: NavItem["group"]; label: string }[] = [
  { key: "sell", label: "Sell" },
  { key: "deliver", label: "Deliver" },
  { key: "team", label: "Team" },
];

export function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
