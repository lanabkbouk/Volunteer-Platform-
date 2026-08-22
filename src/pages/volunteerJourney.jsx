// pages/volunteerJourney.jsx
//
// صفحة "My Journey" — مستقلة بالكامل عن Volunteer Profile: كل ما يخص
// أثر المتطوع (ساعات، منظمات، إنجازات، فرص مكتملة) صار هون بدل ما يكون
// مبعثر بين أقسام داخل صفحة البروفايل. نفس الـ Components والـ hooks
// المستخدمة أصلًا بالمشروع (VolunteeringHoursSummary، AchievementsList،
// useMyParticipationsQuery) بدون أي منطق أو نداء API جديد.

import { useMemo } from "react";
import Typography from "../components/ui/Typography";
import AuthAlert from "../components/auth/AuthAlert";
import VolunteeringHoursSummary from "../components/volunteerProfile/VolunteeringHoursSummary";
import AchievementsList from "../components/volunteerProfile/AchievementsList";
import CompletedOpportunitiesTimeline from "../components/volunteerProfile/CompletedOpportunitiesTimeline";
import { useMyParticipationsQuery } from "../hooks/queries/useMyParticipationsQuery";
import { isCompletedParticipation } from "../utils/volunteerHoursSummary";
import { PANEL_SURFACE } from "../utils/surfaceStyles";

export default function VolunteerJourneyPage() {
  // نفس مفتاح الكاش (queryKeys.participations.mine) المستخدم أصلًا داخل
  // useVolunteerHoursSummaryQuery فوق — فما في أي نداء شبكة إضافي هون،
  // React Query بيرجّع نفس البيانات المخزّنة أصلًا
  const participationsQuery = useMyParticipationsQuery();
  const completedParticipations = useMemo(
    () => (participationsQuery.data ?? []).filter(isCompletedParticipation),
    [participationsQuery.data],
  );
  // ⚠️ بدون هاد الفحص، فشل الجلب (انقطاع شبكة مثلًا) كان يبان تمامًا متل
  // "المتطوع فعلًا ما عنده أي فرصة مكتملة" (data ?? [] بيرجع مصفوفة فاضية
  // بصمت) — لازم نميّز الحالتين للمستخدم
  const completedError = participationsQuery.isError
    ? participationsQuery.error?.message || "Failed to load your completed opportunities"
    : "";

  return (
    <div className="mx-auto w-full flex-1 max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="container mx-auto px-4 md:px-16 py-10 md:py-14">
        <Typography variant="sectionTitle" className="mb-2">
          My Journey
        </Typography>
        <Typography variant="body" className="mb-8 text-body">
          Your volunteering story so far — hours confirmed, organizations you've supported, and achievements you've earned along the way.
        </Typography>

        <section className={`${PANEL_SURFACE} p-6 md:p-8`}>
          <Typography variant="h4" gutterBottom>
            Volunteering Overview
          </Typography>
          <VolunteeringHoursSummary />
        </section>

        {/* الإنجازات (طبقة "الهوية" — ملخّص/تحفيز، متل قسم Overview فوقها)
            قبل الـ Timeline التفصيلي تحتها (طبقة "المعاملات" الزمنية) —
            نفس ترتيب صفحات الإنجازات/البروفايل العالمية (GitHub, Strava,
            Duolingo): إبراز الإنجازات كـ"واجهة تحفيزية" قبل السجل الزمني
            التفصيلي، بدل إغراقها بعد قائمة طويلة */}
        <section className={`mt-8 ${PANEL_SURFACE} p-6 md:p-8`}>
          <Typography variant="h4" gutterBottom>
            Achievements
          </Typography>
          <AchievementsList />
        </section>

        <section className={`mt-8 ${PANEL_SURFACE} p-6 md:p-8`}>
          <Typography variant="h4" gutterBottom>
            Completed Opportunities
          </Typography>
          {completedError ? (
            <AuthAlert variant="error">{completedError}</AuthAlert>
          ) : (
            <CompletedOpportunitiesTimeline participations={completedParticipations} />
          )}
        </section>
      </div>
    </div>
  );
}
