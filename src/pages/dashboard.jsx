// pages/dashboard.jsx
//
// داشبورد المنظمة: إحصائيات سريعة + توزيع المتطوعين على الفرص + أحدث
// النشاطات. هالملف مسؤول بس عن الجلب وحالات العرض (تحميل/فارغ/جاهز)
// — كل قسم Component منفصل بمجلد components/dashboard/ مسؤول عن
// عرضه هو بس، بنفس نمط صفحة Home.

import { useNavigate } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import Typography from "../components/ui/Typography";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/common/EmptyState";
import VerificationStatusBanner from "../components/OrgProfile/VerificationStatusBanner";
import DashboardStatsGrid from "../components/dashboard/DashboardStatsGrid";
import OrganizationAnalyticsCharts from "../components/dashboard/OrganizationAnalyticsCharts";
import OpportunitiesBreakdownChart from "../components/dashboard/OpportunitiesBreakdownChart";
import RecentActivityFeed from "../components/dashboard/RecentActivityFeed";
import { useOrganizationDashboardQuery } from "../hooks/queries/useOrganizationDashboardQuery";
import { useAuth } from "../context/AuthContext";
import { useOrganizationVerification } from "../hooks/useOrganizationVerification";
import { PANEL_SURFACE, CARD_SURFACE } from "../utils/surfaceStyles";
import { ROUTES } from "../constants/paths";
import { getOrganizationId } from "../utils/auth/getOrganizationId";

function DashboardSkeleton() {
  return (
    <div>
      {/* نفس شبكة DashboardStatsGrid بالضبط (5 بطاقات، نفس breakpoints) —
          وإلا يصير قفزة تخطيط واضحة (عدد أعمدة وبطاقات مختلف) لحظة
          انتهاء التحميل واستبدال الـ Skeleton بالمحتوى الحقيقي */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={`${CARD_SURFACE} p-8 flex flex-col items-center gap-3`}>
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className={`${PANEL_SURFACE} p-6 md:p-8 flex flex-col gap-4`}>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>

        <div className={`${PANEL_SURFACE} p-6 md:p-8 flex flex-col gap-4`}>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 ${PANEL_SURFACE} p-6 md:p-8 flex flex-col gap-5`}>
          <Skeleton className="h-5 w-48" />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full rounded-lg" />
          ))}
        </div>

        <div className={`${PANEL_SURFACE} p-6 md:p-8 flex flex-col gap-4`}>
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const organizationId = getOrganizationId(user);
  const { status, rejectionReason, isVerified, hasLoadError } = useOrganizationVerification();

  const dashboardQuery = useOrganizationDashboardQuery(organizationId);
  // isLoading (isPending && isFetching) مش isPending لحالها: isPending
  // بتضل true للأبد لما الاستعلام يكون enabled:false (organizationId غير
  // متوفر بعد)، فكانت الصفحة رح تعلق بالـ Skeleton بشكل دائم (نفس ملاحظة
  // orgProfile.jsx بالضبط)
  const loading = dashboardQuery.isLoading;
  // الخدمة بترجع { success, data } دايمًا (ما بترمي استثناء)، فمنطق
  // التحقق يضل هون بدل الاعتماد على query.isError
  const data = dashboardQuery.data?.success ? dashboardQuery.data.data : null;
  // isFetched (مو !loading): الاستعلام لازم يكون نفّذ فعليًا مرة عالأقل
  // قبل ما نعتبرها "فشلت" — تفاديًا لظهور رسالة خطأ لحظية بوضع real
  // بينما لسا منستنى organizationId يوصل من AuthContext
  const error = dashboardQuery.isFetched && !dashboardQuery.data?.success
    ? dashboardQuery.data?.error || "Unable to load dashboard data"
    : "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <VerificationStatusBanner status={status} rejectionReason={rejectionReason} hasLoadError={hasLoadError} />

      <Typography variant="sectionTitle" className="mb-2">
        Dashboard
      </Typography>
      <Typography variant="body" className="mb-8 text-body">
        An overview of your organization's volunteering activity.
      </Typography>

      {error && (
        <p className="mb-4 rounded-lg border border-danger bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : !data || data.totalOpportunities === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          title="Nothing to show yet"
          description={
            isVerified
              ? "Publish your first volunteering opportunity to start seeing stats and activity here."
              : "Once your organization is verified, you'll be able to publish causes and track activity here."
          }
          actionLabel={isVerified ? "Create Your First Cause" : undefined}
          onAction={isVerified ? () => navigate(ROUTES.CREATE_CAUSE) : undefined}
        />
      ) : (
        <>
          <DashboardStatsGrid data={data} />

          <div className="mb-8">
            <OrganizationAnalyticsCharts analyticsTrends={data.analyticsTrends} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <OpportunitiesBreakdownChart opportunities={data.opportunitiesBreakdown} />
            </div>

            <RecentActivityFeed activity={data.recentActivity} />
          </div>
        </>
      )}
    </div>
  );
}