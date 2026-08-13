// constants/notificationTypes.js
//
// مصدر واحد لكل ما يخص عرض نوع التنبيه بصريًا (أيقونة/لون/تسمية) — كان
// مكرر سابقًا داخل NotificationBell.jsx فقط، وصار لازم يُستخدم كمان من
// صفحة /notifications (pages/notifications.jsx) لبناء تابات الفلترة
// وعرض نفس الأيقونة/اللون بكل مكان بالمشروع.

import { Trophy, Clock3, CalendarClock, CheckCircle2, XCircle, LogOut, Bell } from "lucide-react";

export const NOTIFICATION_TYPE_ICONS = {
  achievement: Trophy,
  hours: Clock3,
  "status-accepted": CheckCircle2,
  "status-rejected": XCircle,
  "org-verified": CheckCircle2,
  "org-rejected": XCircle,
  "applicant-withdrawn": LogOut,
  "opportunity-reminder": CalendarClock,
};

export const NOTIFICATION_TYPE_ICON_COLORS = {
  achievement: "text-amber-500",
  hours: "text-primary",
  "status-accepted": "text-emerald-500",
  "status-rejected": "text-red-500",
  "org-verified": "text-emerald-500",
  "org-rejected": "text-red-500",
  "applicant-withdrawn": "text-heading/50",
  "opportunity-reminder": "text-sky-500",
};

// تسميات مجموعات لتابات الفلترة بصفحة /notifications — مش لازم نغطي كل
// نوع صراحة، أي نوع غير موجود هون بيرجع "Updates" (fallback بالصفحة نفسها)
export const NOTIFICATION_TYPE_LABELS = {
  achievement: "Achievements",
  hours: "Hours",
  "status-accepted": "Accepted",
  "status-rejected": "Declined",
  "org-verified": "Verification",
  "org-rejected": "Verification",
  "applicant-withdrawn": "Withdrawals",
  "opportunity-reminder": "Reminders",
};

export const DEFAULT_NOTIFICATION_ICON = Bell;
