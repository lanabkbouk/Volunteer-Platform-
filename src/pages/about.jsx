// pages/about.jsx
//
// صفحة "About": تجلب إحصائيات المنصة عبر usePlatformStatsQuery (React
// Query)، وتمرّرها للمكوّنات. حالات التحميل/الخطأ معالجة بشكل بسيط.

import { usePlatformStatsQuery } from "../hooks/queries/usePlatformStatsQuery";
import { SYRIAN_GOVERNORATES_COUNT } from "../services/syrianGovernorates";
import MissionSection from "../components/about/MissionSection";
import SectionHeader from "../components/about/SectionHeader";
import StatsGrid from "../components/about/StatsGrid";
import ValuesGrid from "../components/about/ValuesGrid";
import VisionGoals from "../components/about/VisionGoals";
import GeometricDivider from "../components/common/GeometricDivider";
import Button from "../components/ui/Button";

export default function About() {
  const statsQuery = usePlatformStatsQuery();
  const isLoading = statsQuery.isPending;
  const stats = statsQuery.data?.success ? statsQuery.data.data : null;
  // فشل جلب الإحصائيات كان يعرض 0 بطاقات بصمت بدون أي إشارة للمستخدم
  const statsError = statsQuery.isError;

  const statsArray = stats
    ? [
        { number: stats.volunteersCount, label: "Active Volunteers" },
        { number: stats.organizationsCount, label: "Organizations" },
        { number: stats.opportunitiesCount, label: "Opportunities" },
        { number: SYRIAN_GOVERNORATES_COUNT, label: "Governorates Covered" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-canvas text-heading py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader />

        <GeometricDivider />

        <MissionSection volunteers={stats?.volunteersCount ?? 0} />

        <GeometricDivider />

        {statsError ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-danger bg-danger/5 px-4 py-3 text-sm text-danger">
            <p>Failed to load platform statistics.</p>
            <Button variant="danger" size="small" onClick={() => statsQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <StatsGrid stats={statsArray} loading={isLoading} />
        )}

        <GeometricDivider />

        <ValuesGrid />

        <GeometricDivider />

        <VisionGoals />
      </div>
    </div>
  );
}