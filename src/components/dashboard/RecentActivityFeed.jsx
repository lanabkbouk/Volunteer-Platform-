// قائمة "أحدث النشاطات": آخر طلبات مشاركة وصلت على فرص المنظمة، كل
// عنصر بيوضّح مين تقدّم، على أي فرصة، وشو حالة طلبه — نفس مكوّن شارة
// الحالة (ParticipationStatusBadge) المستخدم أصلًا بقائمة المتقدمين،
// بدون تكرار منطق الألوان.
//
// كل عنصر رابط مباشر لصفحة "المتقدمين" الخاصة بفرصته (نفس نمط رابط
// breadcrumb بصفحة تفاصيل الفرصة: focus-visible:ring + hover واضح) —
// بشرط توفر opportunityId فعليًا (راجع services/dashboard.js). لو غير
// متوفر لأي سبب (بيانات قديمة/ناقصة)، العنصر يُعرض عاديًا بدون أي رابط
// بدل توجيه المستخدم لمسار فاسد.

import { Link } from "react-router-dom";
import { Users, ChevronRight, Inbox } from "lucide-react";
import Typography from "../ui/Typography";
import ParticipationStatusBadge from "../opportunity/ParticipationStatusBadge";
import { PANEL_SURFACE } from "../../utils/surfaceStyles";
import { ROUTES } from "../../constants/paths";

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function RecentActivityFeed({ activity = [] }) {
  return (
    <div className={`${PANEL_SURFACE} p-6 md:p-8`}>
      {/* أيقونة رأسية موحّدة مع باقي لوحات الداشبورد (نفس نمط
          OrganizationAnalyticsCharts وOpportunitiesBreakdownChart) */}
      <div className="flex items-center gap-2 mb-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Users size={20} aria-hidden="true" />
        </span>
        <Typography variant="h4">Recent Activity</Typography>
      </div>
      <Typography variant="bodySm" className="mb-5 text-body">
        Requests awaiting your review, and recent decisions.
      </Typography>

      {activity.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-3 py-10 px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-heading/5">
            <Inbox size={22} className="text-heading/40" aria-hidden="true" />
          </div>
          <Typography variant="bodySm" className="text-body">
            No recent activity yet.
          </Typography>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-heading/10">
          {activity.map((item) => {
            const isLinkable = Boolean(item.opportunityId);

            const rowContent = (
              <>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users size={16} aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  {/* اسم المتقدّم هو العنوان البارز — هالسكشن أساسًا عن
                      "مين تفاعل"، فاسم الشخص أهم عنصر بصريًا من عنوان
                      الفرصة (يلي صار بسطر ثانوي مع التاريخ تحته) */}
                  <Typography
                    variant="bodySm"
                    color="heading"
                    className={`font-semibold leading-snug truncate ${
                      isLinkable ? "transition-colors group-hover:text-primary" : ""
                    }`}
                  >
                    {item.volunteerName}
                  </Typography>
                  <Typography variant="caption" color="muted" className="block truncate">
                    Applied to {item.opportunityTitle} · {formatDate(item.date)}
                  </Typography>
                </div>

                <ParticipationStatusBadge participation={{ status: item.status }} className="shrink-0" />

                {/* السهم يبان تدريجيًا وينزاح لليمين عند الـ hover — نفس
                    الإشارة البصرية المستخدمة بـ OpportunitiesBreakdownChart،
                    بس بس للعناصر القابلة فعليًا للنقر (isLinkable) */}
                {isLinkable && (
                  <ChevronRight
                    size={18}
                    className="shrink-0 self-center text-heading/20 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary"
                    aria-hidden="true"
                  />
                )}
              </>
            );

            return (
              <li key={item.id} className="py-1 first:pt-0 last:pb-0">
                {isLinkable ? (
                  <Link
                    // ⚠️ الـ hash (#applicant-{id}) هو الإضافة الوحيدة هون —
                    // نفس مسار "قائمة المتقدمين" الأصلي بالضبط (ROUTES.APPLICANTS
                    // + opportunityId)، بس مع معرّف المتقدّم المحدد حتى تقدر
                    // applicantsList.jsx تلقائيًا تعمل Scroll + تمييز مؤقت له
                    // (راجع applicantsList.jsx لتفاصيل القراءة والتمرير)
                    to={`${ROUTES.APPLICANTS}/${item.opportunityId}#applicant-${item.id}`}
                    className="group flex items-start gap-3 -mx-2 rounded-xl px-2 py-2.5 transition-all duration-200 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {rowContent}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 px-2 py-2.5">{rowContent}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}