// ثوابت خيارات الفلترة والفرز لصفحة "My Causes" — بملف منفصل عن
// MyCausesToolbar.jsx (كومبوننت) لنفس سبب applicantFilters.js بالضبط:
// react-refresh (Fast Refresh) بيحتاج أي ملف فيه Component يُصدّر
// Components بس، لا ثوابت مصدّرة معه بنفس الملف.

import { OPPORTUNITY_STATUS } from "./opportunityStatus";

export const CAUSE_STATUS_FILTERS = [
  { name: "All", value: "all" },
  { name: "Open", value: OPPORTUNITY_STATUS.REGISTRATION_OPEN },
  { name: "Closed", value: OPPORTUNITY_STATUS.REGISTRATION_CLOSED },
  { name: "In Progress", value: OPPORTUNITY_STATUS.IN_PROGRESS },
  { name: "Completed", value: OPPORTUNITY_STATUS.COMPLETED },
];

// "Closest start date" هو الترتيب "المنطقي" المتفق عليه: الأقرب موعد
// بدء أول — نفس المعيار المستخدم فعليًا بالترتيب الذكي الافتراضي
// بصفحة myCauses.jsx، بس هون كخيار صريح يقدر المستخدم يختاره يدويًا
export const CAUSE_SORT_OPTIONS = [
  { name: "Newest first", value: "newest" },
  { name: "Closest start date", value: "closest_start" },
];
