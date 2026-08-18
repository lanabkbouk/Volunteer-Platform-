// pages/home.jsx
//
// الصفحة الرئيسية: مسؤولة بس عن جلب البيانات (إحصائيات + فرص مكتملة)
// وتمريرها للكومبوننتات بمجلد components/home/. كل سكشن Component
// منفصل ومسؤول عن عرضه هو بس — هالملف ما فيه أي JSX تصميمي مباشر.

import HomeHero from "../components/home/HomeHero";
import HomeStatsSection from "../components/home/HomeStatsSection";
import HomePartners from "../components/home/HomePartners";
import HomeSuccessStories from "../components/home/HomeSuccessStories";
import HomeHowToJoin from "../components/home/HomeHowToJoin";
import HomeFaqSection from "../components/home/HomeFaqSection";
import Button from "../components/ui/Button";
import AuthAlert from "../components/auth/AuthAlert";
import { usePlatformStatsQuery } from "../hooks/queries/usePlatformStatsQuery";
import { useCompletedOpportunitiesQuery } from "../hooks/queries/useCompletedOpportunitiesQuery";

export default function Home() {
  // نفس هوك الإحصائيات المستخدم بصفحة About — كاش مشترك، فلو المستخدم
  // زار الصفحتين بنفس الجلسة، ما بتنجلب الإحصائيات إلا مرة وحدة بس
  const statsQuery = usePlatformStatsQuery();
  const completedQuery = useCompletedOpportunitiesQuery();

  const stats = statsQuery.data?.success ? statsQuery.data.data : null;
  const completedOpportunities = completedQuery.data ?? [];
  const loading = statsQuery.isPending || completedQuery.isPending;
  // فشل جلب الإحصائيات كان يعرض القسم فاضٍ بصمت بدون أي إشارة للمستخدم
  const statsError = statsQuery.isError;

  return (
    <div className="bg-canvas text-heading">
      <HomeHero volunteersCount={stats?.volunteersCount} loading={loading} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="space-y-24 sm:space-y-28">
          {statsError ? (
            <div className="flex flex-col items-start gap-3">
              <AuthAlert variant="error">Failed to load platform statistics.</AuthAlert>
              <Button variant="primary" size="small" onClick={() => statsQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <HomeStatsSection stats={stats} loading={loading} />
          )}

          <HomeSuccessStories
            opportunities={completedOpportunities}
            loading={loading}
            className="pt-4 sm:pt-6"
          />

          {!loading ? <HomePartners opportunities={completedOpportunities} /> : null}

          <HomeHowToJoin />

          <HomeFaqSection />
        </div>
      </div>
    </div>
  );
}