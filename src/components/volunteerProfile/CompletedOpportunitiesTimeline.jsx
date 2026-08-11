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
import { Building2, Clock3, Calendar, History } from "lucide-react";
import EmptyState from "../common/EmptyState";
import { CARD_SURFACE } from "../../utils/surfaceStyles";
import { ROUTES } from "../../constants/paths";

// يجمع المشاركات حسب شهر/سنة انتهاء الفرصة (opportunity.endDate)، مرتبة
// من الأحدث للأقدم — كل مجموعة تحمل تسمية عرض جاهزة (مثلًا "Aug 2026").
// نفس منطق الترتيب/الفلترة الموجود أصلًا، بدون أي تعديل — راجع
// pages/volunteerJourney.jsx لمصدر البيانات وisCompletedParticipation.
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

// يحوّل المجموعات إلى صفوف عرض متتالية (تسمية شهر ثم عناصرها) — تحضير
// للعرض فقط، بدون أي أثر على الترتيب أو الفلترة أعلاه. الخط الزمني
// العمودي بيصير متّصل بشكل واحد للصفحة كلها (مو مقطّع لكل شهر لحاله)،
// وكل milestone (نقطة) بتمثّل نهاية فرصة واحدة فعليًا، مش الشهر نفسه.
function buildTimelineRows(groups) {
  const rows = [];
  groups.forEach((group) => {
    rows.push({ type: "month", key: `month-${group.key}`, label: group.label });
    group.items.forEach((participation) => {
      rows.push({ type: "item", key: participation.id, participation });
    });
  });
  return rows;
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

  const rows = buildTimelineRows(groupByCompletionMonth(participations));

  return (
    <div className="relative pl-6 sm:pl-7">
      {/* الخط الزمني المتّصل — تدرّج خفيف (أقوى بالأعلى/الأحدث، يخفت
          بالأسفل/الأقدم) بدل لون مسطّح، لإعطاء إحساس تقدّم عبر الرحلة
          (Recent → Earlier) بدون أي عنصر gamification جديد، مجرد تدرّج CSS.
          left-1.5 (6px) هو "محور الرايل" — كل الـ markers تحته محسوبة
          لتتمركز عليه بالضبط بغض النظر عن padding الحاوية المتجاوب */}
      <span
        className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-linear-to-b from-primary/40 via-primary/15 to-primary/5"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          if (row.type === "month") {
            // شارة الشهر/السنة بلون الهوية الثانوي (secondary) — نفس
            // استخدام secondary الموثّق بـ index.css ("لمسات تصميمية/شارات").
            // Marker خاص فيها (حلقة مفرغة) على نفس محور الرايل، بحجم مطابق
            // لنقاط الفرص لكن بأسلوب مختلف (حلقة مقابل تعبئة صلبة) — حتى
            // يبان بوضوح إنه "checkpoint" زمني (شهر) مختلف عن "milestone"
            // فردي (فرصة واحدة)، مع بقاء الاثنين مرتبطين فعليًا بنفس الخط
            return (
              <div key={row.key} className="relative mt-3 first:mt-0">
                <span
                  className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-secondary bg-field sm:-left-7"
                  aria-hidden="true"
                />
                <span className="inline-flex w-fit items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
                  {row.label}
                </span>
              </div>
            );
          }

          const { opportunity, hoursLogged } = row.participation;
          const completionDate = new Date(opportunity.endDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <div key={row.key} className="relative">
              {/* Milestone: نقطة كل فرصة مكتملة على حدة على نفس الرايل —
                  بلون الهوية الأساسي (primary) مع ظل خفيف موحّد مع باقي البطاقات.
                  offset = -padding الحاوية بالضبط (pl-6/pl-7) حتى يتمركز
                  قطرها الـ12px تمامًا فوق محور الرايل (left-1.5) */}
              <span
                className="absolute -left-6 top-3 h-3 w-3 rounded-full bg-primary shadow-sm ring-4 ring-field sm:-left-7"
                aria-hidden="true"
              />

              {/* شريط جانبي رفيع بلون الهوية يربط بصريًا كل بطاقة بالنقطة/الخط
                  المقابلين لها، فوق نفس CARD_SURFACE المستخدم بباقي المشروع.
                  عنوان الفرصة هو العنصر البصري الأساسي (text-base) مقابل
                  صف المعلومات الثانوية الأهدأ (text-xs) تحته */}
              <div
                className={`${CARD_SURFACE} flex flex-col gap-1.5 border-l-2 border-l-primary/30 px-3.5 py-3 transition-colors hover:border-l-primary/60 sm:px-4`}
              >
                <Link
                  to={`${ROUTES.OPPORTUNITIES}/${opportunity.id}`}
                  className="w-fit rounded text-base font-semibold leading-snug text-heading hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {opportunity.title}
                </Link>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-heading/60">
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
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      <Clock3 size={11} className="shrink-0" aria-hidden="true" />
                      {hoursLogged} hour{hoursLogged === 1 ? "" : "s"}
                    </span>
                  )}

                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-primary shrink-0" aria-hidden="true" />
                    {completionDate}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
