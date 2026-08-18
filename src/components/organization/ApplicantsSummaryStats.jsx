// شريط إحصائيات موجز أسفل عنوان صفحة "المتقدمين" — أربع بطاقات صغيرة
// (إجمالي/معلّق/مقبول/مرفوض). عمدًا مكوّن مستقل عن common/StatCard.jsx
// الموجود أصلًا: StatCard مصمم لصفحات تسويقية (Home/About) بخط كبير
// وتأثير Count-Up وHover Elevation — مناسب لعرض "+500 متطوع"، لكن هون
// المطلوب أرقام إدارية ثابتة تُقرأ بسرعة بدون أي حركة، فإعادة استخدامه
// كانت رح تفرض شكل وحركة لا تلائم لوحة إدارة احترافية.

import { CARD_SURFACE } from "../../utils/surfaceStyles";

const STAT_COLOR_CLASSES = {
  neutral: "text-heading",
  gold: "text-amber-600",
  green: "text-emerald-600",
  red: "text-red-600",
};

export default function ApplicantsSummaryStats({ total, pending, accepted, rejected }) {
  const stats = [
    { label: "Total Applicants", value: total, color: "neutral" },
    { label: "Pending", value: pending, color: "gold" },
    { label: "Accepted", value: accepted, color: "green" },
    { label: "Rejected", value: rejected, color: "red" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`${CARD_SURFACE} px-4 py-3 text-center sm:text-left`}
        >
          <p className={`text-2xl font-bold leading-none ${STAT_COLOR_CLASSES[stat.color]}`}>
            {stat.value}
          </p>
          <p className="text-xs text-body mt-1.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}