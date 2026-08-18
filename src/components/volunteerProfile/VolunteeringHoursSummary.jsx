// components/volunteerProfile/VolunteeringHoursSummary.jsx
//
// ملخّص ثابت لساعات التطوع أعلى بروفايل المتطوع (طبقة "الهوية") — رقم
// تراكمي دائم، بعكس صفحة "My Volunteering" (طبقة "المعاملات") التي
// تعرض كل مشاركة بالتفصيل سطرًا سطرًا. هون بنكتفي بملخّص + أعلى 4
// منظمات، ورابط للصفحة الكاملة بدل تكرار نفس القائمة بمكانين.
//
// كل الأرقام هون تجي من useVolunteerHoursSummaryQuery، يلي بدوره
// مبني فوق buildVolunteerHoursSummary الموحّدة (utils/volunteerHoursSummary.js)
// — نفس مصدر الساعات المستخدم بالضبط بـ achievements.js وبإحصائيات
// "لدى هالمنظمة" عند المنظمات، فأي رقم ظاهر هون متطابق مع أي مكان تاني.

import { Link } from "react-router-dom";
import {
  Clock3,
  Building2,
  CheckCircle2,
  Compass,
  Sparkles,
  PlayCircle,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import StatCard from "../common/StatCard";
import EmptyState from "../common/EmptyState";
import Skeleton from "../ui/Skeleton";
import Typography from "../ui/Typography";
import Button from "../ui/Button";
import Chip from "../ui/Chip";
import { useVolunteerHoursSummaryQuery } from "../../hooks/queries/useVolunteerHoursSummaryQuery";
import { ROUTES } from "../../constants/paths";
import { CARD_SURFACE } from "../../utils/surfaceStyles";

// أعلى 4 منظمات فقط بالملخّص — التفصيل الكامل موجود بصفحة My Volunteering
const MAX_ORGANIZATIONS_SHOWN = 4;

export default function VolunteeringHoursSummary() {
  const hoursSummaryQuery = useVolunteerHoursSummaryQuery();
  const summary = hoursSummaryQuery.data;
  const loading = hoursSummaryQuery.isPending;
  const hasError = hoursSummaryQuery.isError;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load your volunteering hours"
        description={hoursSummaryQuery.error?.message || "Failed to load your volunteering hours"}
        actionLabel="Try again"
        onAction={hoursSummaryQuery.refetch}
      />
    );
  }

  // بوابة "لا يوجد شي بعد" لازم تاخد بالحسبان الفرص النشطة كمان (مش
  // بس المكتملة) — وإلا متطوع منضم لفرصة عم تشتغل هلق بس لسا ما خلصت
  // كان رح يشوف "No confirmed hours yet" بدل إحصائية "الفرص النشطة"
  if (summary.completedOpportunitiesCount === 0 && summary.activeOpportunitiesCount === 0) {
    return (
      <EmptyState
        icon={Compass}
        title="No confirmed hours yet"
        description="Once an organization confirms your hours for a completed opportunity, they'll show up here."
      />
    );
  }

  const topOrganizations = summary.byOrganization.slice(0, MAX_ORGANIZATIONS_SHOWN);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock3}
          number={summary.totalConfirmedHours}
          label="Confirmed Hours"
          suffix=""
          hint="Hours an organization has confirmed after an opportunity ended."
        />
        <StatCard
          icon={Building2}
          number={summary.organizationsCount}
          label="Organizations"
          suffix=""
          hint="Unique organizations you've volunteered with."
        />
        <StatCard
          icon={CheckCircle2}
          number={summary.completedOpportunitiesCount}
          label="Completed Opportunities"
          suffix=""
          hint="Opportunities you fully completed and got hours confirmed for."
        />
        <StatCard
          icon={PlayCircle}
          number={summary.activeOpportunitiesCount}
          label="Active Opportunities"
          suffix=""
          hint="Opportunities you're currently accepted into that are happening right now."
        />
      </div>

      {/* بطاقة "الرحلة التطوعية" — سردية موحّدة، مقصودة تختلف بصريًا عن
          شبكة الإحصائيات فوقها (Stat Cards = أرقام سريعة منفصلة، هاي =
          ملخّص واحد مجمّع) حتى ما يصير تكرار بصري بين القسمين */}
      <div className="flex items-start gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-5 shadow-sm sm:p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
          <Sparkles size={18} className="text-primary" aria-hidden="true" />
        </div>
        <p className="text-sm leading-relaxed text-body sm:text-[15px]">
          You've completed <strong className="font-bold text-primary">{summary.completedOpportunitiesCount}</strong>{" "}
          opportunit{summary.completedOpportunitiesCount === 1 ? "y" : "ies"}, contributing{" "}
          <strong className="font-bold text-primary">{summary.totalConfirmedHours}</strong> confirmed hours across{" "}
          <strong className="font-bold text-primary">{summary.organizationsCount}</strong> organization
          {summary.organizationsCount === 1 ? "" : "s"}.
        </p>
      </div>

      {topOrganizations.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <Typography variant="h5">Hours by organization</Typography>
            <Button
              as={Link}
              to={ROUTES.MY_VOLUNTEERING}
              variant="ghost"
              size="small"
              className="px-3! py-1.5! text-sm! gap-1.5"
            >
              View full history
              <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </div>

          <div className={`flex flex-col divide-y divide-heading/10 overflow-hidden ${CARD_SURFACE} shadow-sm`}>
            {topOrganizations.map((organization) => (
              <Link
                key={organization.organizationId}
                to={`${ROUTES.ORGANIZATIONS}/${organization.organizationId}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 size={16} className="text-primary" aria-hidden="true" />
                  </span>
                  <span className="truncate text-sm font-semibold text-heading">
                    {organization.organizationName}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  <Chip color="primary" className="px-2.5! py-1! text-xs font-semibold gap-1">
                    <Clock3 size={12} aria-hidden="true" />
                    {organization.confirmedHours} hrs
                  </Chip>
                  <span className="hidden items-center gap-1 text-xs text-heading/50 sm:flex">
                    <CheckCircle2 size={13} aria-hidden="true" />
                    {organization.completedOpportunitiesCount}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}