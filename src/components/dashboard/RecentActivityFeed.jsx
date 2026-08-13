
// قائمة "أحدث النشاطات": طلبات المشاركة يلي لسا بانتظار مراجعة المنظمة
// (status === PENDING بس — راجع services/dashboard.js) على فرصها، كل
// عنصر بيوضّح على أي فرصة، مين المتقدّم، وشو حالة طلبه — نفس مكوّن شارة
// الحالة (ParticipationStatusBadge) المستخدم أصلًا بقائمة المتقدمين،
// بدون تكرار منطق الألوان.
//
// كل عنصر رابط مباشر لصفحة "المتقدمين" الخاصة بفرصته (نفس نمط رابط
// breadcrumb بصفحة تفاصيل الفرصة: focus-visible:ring + hover بسيط) —
// بشرط توفر opportunityId فعليًا (راجع services/dashboard.js). لو غير
// متوفر لأي سبب (بيانات قديمة/ناقصة)، العنصر يُعرض عاديًا بدون أي رابط
// بدل توجيه المستخدم لمسار فاسد.

import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import Typography from "../ui/Typography";
import ParticipationStatusBadge from "../opportunity/ParticipationStatusBadge";
import EmptyState from "../common/EmptyState";
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
      <div className="mb-5">
        <Typography variant="h4">Recent Activity</Typography>
        <Typography variant="caption" color="muted" className="mt-1 block">
          Requests awaiting your review
        </Typography>
      </div>

      {activity.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No pending requests"
          description="New applications awaiting your review will show up here."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-heading/10">
          {activity.map((item) => {
            // "Opportunity name، Volunteer name، status، والتاريخ": عنوان
            // الفرصة صار السطر الأساسي (هو محور القسم — "أي فرصة محتاجة
            // مراجعة")، واسم المتطوع + التاريخ سطر ثانوي تحته، والشارة
            // بنفس سطر العنوان لأنها بصريًا جزء من "حالة الفرصة" مش المتطوع
            const rowContent = (
              <>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users size={16} aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Typography variant="bodySm" color="heading" weight="medium" truncate className="leading-snug">
                      {item.opportunityTitle}
                    </Typography>
                    <ParticipationStatusBadge participation={{ status: item.status }} className="shrink-0" />
                  </div>
                  <Typography variant="caption" color="muted" className="mt-0.5 block truncate">
                    {item.volunteerName ? `${item.volunteerName} · ` : ""}
                    {formatDate(item.date)}
                  </Typography>
                </div>
              </>
            );

            return (
              <li key={item.id} className="first:pt-0 last:pb-0">
                {item.opportunityId ? (
                  <Link
                    to={`${ROUTES.APPLICANTS}/${item.opportunityId}`}
                    className="flex items-start gap-3 rounded-lg px-2 py-3 -mx-2 transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {rowContent}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 px-2 py-3 -mx-2">{rowContent}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}