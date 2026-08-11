// components/volunteerProfile/CompletedOpportunitiesTimeline.jsx
//
// عرض عمودي زمني للفرص المكتملة — يستقبل قائمة participations جاهزة
// كـ prop (مفلترة أصلًا كـ"مكتملة" عبر isCompletedParticipation، راجع
// pages/volunteerJourney.jsx)، بدون أي جلب بيانات من هون. تاريخ الترتيب
// هو opportunity.endDate — نفس الحقل الذي يحدد أصلًا انتقال الفرصة لحالة
// COMPLETED (راجع utils/opportunityStatus.js → getEffectiveOpportunityStatus)،
// مش تاريخ مخترع.
//
// ⚠️ نفس الفرصة ممكن تتكرر أكتر من مرة إذا كان عند المتطوع أكتر من
// participation مستقلة عليها (مثلًا: انسحب/اترفض ثم أعاد التقديم لاحقًا
// وقُبل — راجع participateInOpportunity بـ services/opportunities.js).
// كل سطر هون participation حقيقية مستقلة بذاتها، فما منقوم بأي دمج أو
// حذف — بس بصريًا بيبانوا كعناصر متتالية بنفس مجموعة الشهر بدل تكرار يبان كخطأ.

import { Link } from "react-router-dom";
import { Building2, Clock3, History } from "lucide-react";
import EmptyState from "../common/EmptyState";
import Typography from "../ui/Typography";
import { CARD_SURFACE } from "../../utils/surfaceStyles";
import { ROUTES } from "../../constants/paths";

// يجمع المشاركات حسب شهر/سنة انتهاء الفرصة (opportunity.endDate)، مرتبة
// من الأحدث للأقدم — كل مجموعة تحمل تسمية عرض جاهزة (مثلًا "Aug 2026")
function groupByCompletionMonth(participations) {
  const sorted = [...participations].sort(
    (a, b) => new Date(b.opportunity.endDate) - new Date(a.opportunity.endDate),
  );

  const groups = [];
  const groupsByKey = new Map();

  sorted.forEach((participation) => {
    const endDate = new Date(participation.opportunity.endDate);
    const key = `${endDate.getFullYear()}-${endDate.getMonth()}`;

    let group = groupsByKey.get(key);
    if (!group) {
      group = {
        key,
        label: endDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        items: [],
      };
      groupsByKey.set(key, group);
      groups.push(group);
    }

    group.items.push(participation);
  });

  return groups;
}

export default function CompletedOpportunitiesTimeline({ participations = [] }) {
  if (participations.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No completed opportunities yet"
        description="Complete your first volunteering opportunity to start building your journey here."
      />
    );
  }

  const groups = groupByCompletionMonth(participations);

  return (
    <div className="flex flex-col">
      {groups.map((group, index) => (
        <div key={group.key} className="relative pb-6 pl-6 last:pb-0 sm:pl-7">
          {/* الخط الواصل بين النقطتين — مخفي بعد آخر مجموعة */}
          {index !== groups.length - 1 && (
            <span
              className="absolute left-1.75 top-4 bottom-0 w-px bg-heading/10"
              aria-hidden="true"
            />
          )}
          <span
            className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-field"
            aria-hidden="true"
          />

          <Typography variant="bodySm" weight="semibold" className="mb-2 text-heading/70">
            {group.label}
          </Typography>

          <div className="flex flex-col gap-2">
            {group.items.map((participation) => {
              const { opportunity, hoursLogged } = participation;
              return (
                <div
                  key={participation.id}
                  className={`${CARD_SURFACE} flex flex-col gap-1 px-3.5 py-2.5 sm:px-4`}
                >
                  <Link
                    to={`${ROUTES.OPPORTUNITIES}/${opportunity.id}`}
                    className="w-fit rounded text-sm font-semibold text-heading hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {opportunity.title}
                  </Link>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-heading/60">
                    {opportunity.organization?.name && (
                      <Link
                        to={`${ROUTES.ORGANIZATIONS}/${opportunity.organization.id}`}
                        className="flex items-center gap-1 rounded hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <Building2 size={12} className="text-primary shrink-0" aria-hidden="true" />
                        {opportunity.organization.name}
                      </Link>
                    )}

                    {typeof hoursLogged === "number" && (
                      <span className="flex items-center gap-1">
                        <Clock3 size={12} className="text-primary shrink-0" aria-hidden="true" />
                        {hoursLogged} hour{hoursLogged === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
