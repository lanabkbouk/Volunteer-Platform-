
// رسم بياني بسيط (Progress Bars أفقية) يعرض نسبة امتلاء كل فرصة
// بالمتطوعين. تعمّدت عدم إضافة مكتبة رسوم بيانية خارجية (Chart.js,
// Recharts...) لأن البيانات هون بسيطة (نسبة مئوية لكل فرصة) ولا تستدعي
// وزن مكتبة كاملة — Progress Bar متحرك بـ Framer Motion (موجودة أصلاً
// بالمشروع) كافي تمامًا ويعطي نفس الأثر البصري المطلوب بالبريف.
//
// كل Cause (= فرصة، نفس تسمية "My Causes") قابلة للنقر وبتوصل لصفحة
// "My Causes" — نفس صفحة إدارة القضايا الموجودة أصلًا بالمنظمة (نفس
// رابط الـ Sidebar بالضبط)، بدون أي فلترة جديدة: هاي الصفحة أصلًا
// بتعرض كل قضايا المنظمة بكل حالاتها، فما في داعي لبناء أي منطق فلترة
// إضافي (لا query param ولا غيره) عشان توصل لمحتوى مفيد.
//
// opportunity.id بينمرّر عبر router state (state.highlightOpportunityId)
// بدل query param — بدون أي تلوّث بالـ URL. myCauses.jsx هي المسؤولة
// الوحيدة عن قراءته والتمرير + التمييز المؤقت؛ هون بس بيانات التنقل.

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Typography from "../ui/Typography";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";
import { ROUTES } from "../../constants/paths";

export default function OpportunitiesBreakdownChart({ opportunities = [] }) {
  return (
    <div className={`${PANEL_SURFACE} p-6 md:p-8`}>
      <Typography variant="h4" gutterBottom>
        Volunteer Capacity by Cause
      </Typography>

      <div className="flex flex-col gap-5 mt-2">
        {opportunities.map((opportunity) => {
          const percent = opportunity.maxVolunteers
            ? Math.min(100, Math.round((opportunity.currentVolunteers / opportunity.maxVolunteers) * 100))
            : 0;
          const isClickable = Boolean(opportunity.id);

          const rowContent = (
            <>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <Typography variant="bodySm" color="heading" weight="medium" truncate className="max-w-[70%]">
                  {opportunity.title}
                </Typography>
                <Typography variant="caption" color="muted" className="whitespace-nowrap">
                  {opportunity.currentVolunteers}/{opportunity.maxVolunteers} volunteers
                </Typography>
              </div>

              <div className="h-2 w-full rounded-full bg-heading/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </>
          );

          return isClickable ? (
            <Link
              key={opportunity.id}
              to={ROUTES.MY_CAUSES}
              state={{ highlightOpportunityId: opportunity.id }}
              className="block rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {rowContent}
            </Link>
          ) : (
            <div key={opportunity.id} className="px-2 py-1.5 -mx-2">
              {rowContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}