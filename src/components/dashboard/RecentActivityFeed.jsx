
// قائمة "أحدث النشاطات": آخر طلبات مشاركة وصلت على فرص المنظمة، كل
// عنصر بيوضّح مين تقدّم، على أي فرصة، وشو حالة طلبه — نفس مكوّن شارة
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
      <Typography variant="h4" gutterBottom>
        Recent Activity
      </Typography>

      {activity.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No recent activity yet"
          description="New volunteer applications will show up here as they come in."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-heading/10">
          {activity.map((item) => {
            const rowContent = (
              <>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users size={16} aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <Typography variant="bodySm" color="heading" className="leading-snug">
                    <span className="font-medium">{item.volunteerName}</span> applied to{" "}
                    <span className="font-medium">{item.opportunityTitle}</span>
                  </Typography>
                  <Typography variant="caption" color="muted">
                    {formatDate(item.date)}
                  </Typography>
                </div>

                <ParticipationStatusBadge participation={{ status: item.status }} />
              </>
            );

            return (
              <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                {item.opportunityId ? (
                  <Link
                    to={`${ROUTES.APPLICANTS}/${item.opportunityId}`}
                    className="flex items-start gap-3 rounded-lg transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {rowContent}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3">{rowContent}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}