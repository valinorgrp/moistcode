import { Activity, CalendarDays, LayoutDashboard, Receipt, Users } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Pipeline", icon: Users },
  { href: "/quotes", label: "Quotes", icon: Receipt },
  { href: "/activities", label: "Activity", icon: Activity },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
] as const;
