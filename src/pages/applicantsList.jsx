// صفحة "المتقدمين" عند المنظمة — تعرض كل من تقدّم على فرصة معيّنة
// بغض النظر عن حالته (pending/accepted/rejected)، مع إحصائيات موجزة،
// وبحث/فلترة/فرز محليين فوق القائمة المحمّلة أصلًا بالكامل.
//
// ⚠️ مهم: المرفوضون ما بينزالوا أبدًا من العرض هون — فقط تُخفى أزرار
// القبول/الرفض عنهم (راجع ApplicantCard) ويظهر مؤشر "Decision completed"
// بدلها. الفلترة بالأعلى اختيارية بيد المستخدم، مش حذف فعلي للبيانات.

import { useEffect, useMemo, useState } from "react";
import { useShowMore } from "../hooks/useShowMore";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import Typography from "../components/ui/Typography";
import Button from "../components/ui/Button";
import ApplicantCard from "../components/organization/ApplicantCard";
import ApplicantsSummaryStats from "../components/organization/ApplicantsSummaryStats";
import ApplicantsToolbar from "../components/organization/ApplicantsToolbar";
import ManageHoursModal from "../components/organization/ManageHoursModal";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/common/EmptyState";
import ShowMoreButton from "../components/common/ShowMoreButton";
import VerificationStatusBanner from "../components/OrgProfile/VerificationStatusBanner";
import Toast from "../components/common/Toast";
import { useOrganizationVerification } from "../hooks/useOrganizationVerification";
import { useOpportunityDetailsQuery } from "../hooks/queries/useOpportunityDetailsQuery";
import { useApplicantsQuery } from "../hooks/queries/useApplicantsQuery";
import { useUpdateParticipationStatusMutation } from "../hooks/queries/useUpdateParticipationStatusMutation";
import { useUpdateParticipationHoursMutation } from "../hooks/queries/useUpdateParticipationHoursMutation";
import { useToast } from "../hooks/useToast";
import { markApplicantStatusSeen } from "../utils/organizationApplicantSeenTracker";
import { PARTICIPATION_STATUS } from "../constants/participationStatus";
import { CARD_SURFACE } from "../utils/surfaceStyles";
import { ROUTES } from "../constants/paths";

export default function ApplicantsList() {
  const { id } = useParams();
  const { status, rejectionReason, isVerified, hasLoadError } = useOrganizationVerification();

  const opportunityQuery = useOpportunityDetailsQuery(id);
  const applicantsQuery = useApplicantsQuery(id);
  const updateStatusMutation = useUpdateParticipationStatusMutation(id);
  const updateHoursMutation = useUpdateParticipationHoursMutation(id);

  const opportunity = opportunityQuery.data?.opportunity ?? null;
  const applicants = useMemo(() => applicantsQuery.data ?? [], [applicantsQuery.data]);
  const loading = opportunityQuery.isPending || applicantsQuery.isPending;
  // فشل جلب الفرصة أو المتقدمين لازم يظهر كخطأ صريح — وإلا القائمة الفاضية
  // بتنعرض كـ"لا يوجد متقدمين بعد" وهي فعليًا خطأ شبكة/سيرفر
  const error = opportunityQuery.isError
    ? opportunityQuery.error?.message || "Failed to load this cause"
    : applicantsQuery.isError
      ? applicantsQuery.error?.message || "Failed to load applicants"
      : "";
  const { toast, showSuccess, showError, closeToast } = useToast();

  // تعليم كل انسحاب ظاهر هلق كـ"مشاهَد" — بعد هالسطر، تنبيه "A volunteer
  // withdrew" المقابل بيختفي من جرس الإشعارات (نفس فلسفة markStatusSeen
  // المستخدمة بصفحة My Volunteering عند المتطوع، بس هون من منظور المنظمة)
  useEffect(() => {
    applicants.forEach((applicant) => {
      if (applicant.status === PARTICIPATION_STATUS.WITHDRAWN) {
        markApplicantStatusSeen(applicant.id, PARTICIPATION_STATUS.WITHDRAWN);
      }
    });
  }, [applicants]);

  // "إدارة الساعات" ما بتظهر إلا بعد ما تاريخ انتهاء الفرصة الحقيقي يفوت
  const opportunityHasEnded = Boolean(
    opportunity?.endDate && new Date(opportunity.endDate) < new Date(),
  );
  

  // null = المودال مقفل، كائن applicant = مفتوح على هالمتقدّم بالذات
  const [hoursModalApplicant, setHoursModalApplicant] = useState(null);

  // بفضل mutation.variables: نعرف بالضبط أي متقدّم قيد التحديث حاليًا
  // بدون الحاجة لـ useState منفصلة (updatingId) نديرها يدويًا
  const updatingId = updateStatusMutation.isPending
    ? updateStatusMutation.variables?.applicantId
    : null;

  const handleStatusChange = async (applicantId, newStatus, reason) => {
    if (!isVerified) return;

    // التأكيد على الرفض ما عاد window.confirm منفصل — مودال سبب الرفض
    // نفسه (RejectionReasonModal بـ ApplicantCard.jsx) هو التأكيد الآن،
    // بما إنه سبب إلزامي فعليًا بحد ذاته. القبول لسا بلا أي تأكيد: أثره
    // أقل خطورة (لا يمنع المتطوع من أي شيء)
    const result = await updateStatusMutation.mutateAsync({ applicantId, status: newStatus, reason });

    if (!result.success) {
      showError(result.error || "Failed to update this request");
      return;
    }

    showSuccess(
      newStatus === PARTICIPATION_STATUS.ACCEPTED
        ? "Applicant accepted."
        : "Applicant rejected.",
    );
  };

  const handleConfirmHours = async (hours) => {
    if (!hoursModalApplicant) return;

    const result = await updateHoursMutation.mutateAsync({
      applicantId: hoursModalApplicant.id,
      hours,
    });

    if (!result.success) {
      showError(result.error || "Failed to update hours");
      return;
    }

    showSuccess("Hours confirmed.");
    setHoursModalApplicant(null);
  };

  // ————— بحث / فلترة / فرز (Client-side بالكامل) —————
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const visibleApplicants = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = applicants.filter((applicant) => {
      const matchesStatus = statusFilter === "all" || applicant.status === statusFilter;
      const matchesSearch = !query || applicant.volunteer?.name?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });

    // participatedAt نص تاريخ (YYYY-MM-DD) فمقارنة السلاسل كافية
    // ودقيقة، بدون حاجة نبني كائن Date لكل عنصر
    return [...filtered].sort((a, b) =>
      sortOrder === "newest"
        ? b.participatedAt.localeCompare(a.participatedAt)
        : a.participatedAt.localeCompare(b.participatedAt),
    );
  }, [applicants, search, statusFilter, sortOrder]);

  const stats = useMemo(
    () => ({
      total: applicants.length,
      pending: applicants.filter((a) => a.status === PARTICIPATION_STATUS.PENDING).length,
      accepted: applicants.filter((a) => a.status === PARTICIPATION_STATUS.ACCEPTED).length,
      rejected: applicants.filter((a) => a.status === PARTICIPATION_STATUS.REJECTED).length,
    }),
    [applicants],
  );

  // فرق بين "ما في متقدمين إطلاقًا" و"الفلتر الحالي ما طابق حدا" —
  // الحالتين لازم رسالة مختلفة، وإلا مستخدم فلترة عالإجباري بيفتكر إنه
  // الفرصة أصلًا بلا متقدمين
  const hasAnyApplicants = applicants.length > 0;
  const hasFilteredResults = visibleApplicants.length > 0;

  // Show more فوق نتائج البحث/الفلترة نفسها (وليس القائمة الخام) —
  // وإلا لو فلترت لـ 3 نتائج بس، بيضل زر "Show more" ظاهر بالغلط
  const { visibleItems: pagedApplicants, hasMore, remainingCount, showMore } = useShowMore(visibleApplicants);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <VerificationStatusBanner status={status} rejectionReason={rejectionReason} hasLoadError={hasLoadError} />

      <Link
        to={ROUTES.MY_CAUSES}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-4"
      >
        <ArrowLeft size={16} />
        Back to My Causes
      </Link>

      <Typography variant="sectionTitle" className="mb-1">
        Applicants
      </Typography>
      {!loading && (
        <Typography variant="body" className="mb-6 text-body">
          {opportunity?.title}
        </Typography>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={`${CARD_SURFACE} p-5 flex flex-col sm:flex-row sm:items-center gap-4`}>
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-danger bg-danger/5 px-4 py-3 text-sm text-danger">
          <p>{error}</p>
          <Button
            variant="danger"
            size="small"
            onClick={() => {
              opportunityQuery.refetch();
              applicantsQuery.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      ) : !hasAnyApplicants ? (
        <EmptyState
          icon={Users}
          title="No applicants yet"
          description="Once volunteers apply to this cause, they'll show up here."
        />
      ) : (
        <>
          <ApplicantsSummaryStats {...stats} />

          <ApplicantsToolbar
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />

          {!hasFilteredResults ? (
            <EmptyState
              icon={Users}
              title="No matching applicants"
              description="Try a different search term or reset the status filter."
            />
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {pagedApplicants.map((applicant) => (
                  <ApplicantCard
                    key={applicant.id}
                    applicant={applicant}
                    isUpdating={updatingId === applicant.id}
                    isVerified={isVerified}
                    opportunityHasEnded={opportunityHasEnded}
                    onAccept={(applicantId) =>
                      handleStatusChange(applicantId, PARTICIPATION_STATUS.ACCEPTED)
                    }
                    onReject={(applicantId, reason) =>
                      handleStatusChange(applicantId, PARTICIPATION_STATUS.REJECTED, reason)
                    }
                    onManageHours={setHoursModalApplicant}
                  />
                ))}
              </div>
              {hasMore && <ShowMoreButton remainingCount={remainingCount} onClick={showMore} />}
            </>
          )}
        </>
      )}

      <ManageHoursModal
        open={Boolean(hoursModalApplicant)}
        onClose={() => setHoursModalApplicant(null)}
        onConfirm={handleConfirmHours}
        volunteerName={hoursModalApplicant?.volunteer?.name}
        committedHours={hoursModalApplicant?.committedHours}
        currentHoursLogged={hoursModalApplicant?.hoursLogged}
        isSubmitting={updateHoursMutation.isPending}
      />

      <Toast
        message={toast.message}
        variant={toast.variant}
        duration={7000}
        onClose={closeToast}
      />
    </div>
  );
}