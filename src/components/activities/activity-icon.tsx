import { Calendar, FileText, Mail, Phone, SquareCheck } from "lucide-react";
import type { ActivityType } from "@/types/crm";

const ICONS: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  task: SquareCheck,
};

export function ActivityIcon({ type, size = 15 }: { type: ActivityType; size?: number }) {
  const Icon = ICONS[type];
  return <Icon size={size} />;
}
