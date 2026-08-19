// constants/opportunityTabs.js
//
// معرّفات تابات صفحة تصفح الفرص (All/Suggested) — منفصلة عن
// OpportunityTabs.jsx نفسه (غلاف عرض بحت فوق ui/Tabs.jsx)، بنفس نمط
// constants/participationTabs.js تمامًا. الفصل هون مش تنظيم فقط:
// ملف يصدّر Component افتراضي بجانب ثابت آخر (OPPORTUNITY_TABS) بيعطّل
// Fast Refresh (react-refresh/only-export-components) — نقل الثوابت
// لملف مستقل يحل المشكلة ويحافظ على نفس نمط باقي التابات بالمشروع.

import { Sparkles, LayoutGrid } from "lucide-react";

export const OPPORTUNITY_TABS = {
  ALL: "all",
  SUGGESTED: "suggested",
};

// LayoutGrid لتبويب التصفح العادي، Sparkles لتبويب المقترح — نفس
// مستوى التفصيل البصري بين التبويبين، ما في وحدة "ناقصة" أيقونة
export const OPPORTUNITY_TAB_DEFS = [
  { id: OPPORTUNITY_TABS.ALL, label: "All Opportunities", icon: LayoutGrid },
  { id: OPPORTUNITY_TABS.SUGGESTED, label: "Recommended for You", icon: Sparkles },
];
