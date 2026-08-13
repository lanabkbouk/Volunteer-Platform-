// constants/participationTabs.js
//
// تعريف تابات فلترة صفحة "My Volunteering" — منفصل عن أي منطق عرض
// (TabsFilter) أو حساب أعداد (useParticipationCounts) حتى يسهل استبدال
// مصدر الأعداد لاحقًا بعدّادات جاهزة من الـ API بدون لمس هذا الملف ولا
// TabsFilter نفسه. راجع participates.jsx لكيفية دمج count مع كل تعريف
// قبل تمريرها لـ TabsFilter.

import { LayoutGrid, Clock, CheckCircle2, PlayCircle, Award, XCircle, LogOut } from "lucide-react";
import { PARTICIPATION_DISPLAY_STATUS } from "../utils/participationDisplayStatus";

export const PARTICIPATION_TAB = { ALL: "all", ...PARTICIPATION_DISPLAY_STATUS };

// colorVariant دلالي (neutral/warning/success/danger) — يحدّد لون شارة
// العدد بـ TabsFilter بغض النظر عن كون التاب نشط حاليًا أو لا:
// Pending -> أصفر/برتقالي، Accepted -> أخضر، Rejected -> أحمر،
// وباقي الحالات (All, Active, Completed, Withdrawn) -> رمادي محايد
export const PARTICIPATION_TAB_DEFS = [
  { id: PARTICIPATION_TAB.ALL, label: "All", icon: LayoutGrid, colorVariant: "neutral" },
  { id: PARTICIPATION_DISPLAY_STATUS.PENDING, label: "Pending", icon: Clock, colorVariant: "warning" },
  { id: PARTICIPATION_DISPLAY_STATUS.ACCEPTED, label: "Accepted", icon: CheckCircle2, colorVariant: "success" },
  { id: PARTICIPATION_DISPLAY_STATUS.ACTIVE, label: "Active", icon: PlayCircle, colorVariant: "neutral" },
  { id: PARTICIPATION_DISPLAY_STATUS.COMPLETED, label: "Completed", icon: Award, colorVariant: "neutral" },
  { id: PARTICIPATION_DISPLAY_STATUS.REJECTED, label: "Rejected", icon: XCircle, colorVariant: "danger" },
  { id: PARTICIPATION_DISPLAY_STATUS.WITHDRAWN, label: "Withdrawn", icon: LogOut, colorVariant: "neutral" },
];
