import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, FolderPlus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Typography from "../components/ui/Typography";
import Button from "../components/ui/Button";
import MyCauseCard from "../components/organization/MyCauseCard";
import VerificationStatusBanner from "../components/OrgProfile/VerificationStatusBanner";
import CardSkeleton from "../components/ui/CardSkeleton";
import EmptyState from "../components/common/EmptyState";
import ShowMoreButton from "../components/common/ShowMoreButton";
import Toast from "../components/common/Toast";
import { useAuth } from "../context/AuthContext";
import { useMyOpportunitiesQuery } from "../hooks/queries/useMyOpportunitiesQuery";
import { useDeleteOpportunityMutation } from "../hooks/queries/useDeleteOpportunityMutation";
import { useToggleOpportunityStatusMutation } from "../hooks/queries/useToggleOpportunityStatusMutation";
import { useOrganizationVerification } from "../hooks/useOrganizationVerification";
import { useToast } from "../hooks/useToast";
import { useShowMore } from "../hooks/useShowMore";
import { ROUTES } from "../constants/paths";
import { getOrganizationId } from "../utils/auth/getOrganizationId";

export default function MyCauses() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const organizationId = getOrganizationId(user);
  const { status, rejectionReason, isVerified, hasLoadError } = useOrganizationVerification();

  const opportunitiesQuery = useMyOpportunitiesQuery(organizationId);
  const deleteMutation = useDeleteOpportunityMutation(organizationId);
  // كانت هاي الميوتيشن معرّفة أصلًا (useToggleOpportunityStatusMutation)
  // بس ما بينمررش onToggleStatus إطلاقًا لـ MyCauseCard — فزر القفل/الفتح
  // كان يشتغل ظاهريًا (confirm + spinner) بدون أي تأثير فعلي على البيانات
  const toggleStatusMutation = useToggleOpportunityStatusMutation(organizationId);

  const opportunities = useMemo(() => opportunitiesQuery.data ?? [], [opportunitiesQuery.data]);
  const { visibleItems: visibleOpportunities, hasMore, remainingCount, showMore } = useShowMore(opportunities);
  const loading = opportunitiesQuery.isPending;
  // فشل الجلب لازم يظهر كخطأ صريح مع إعادة محاولة، مش كحالة "فاضية"
  // عادية — وإلا المستخدم بيظن إنه ما نشر قضايا أصلًا بينما فعليًا في
  // خطأ شبكة/سيرفر
  const error = opportunitiesQuery.isError
    ? opportunitiesQuery.error?.message || "Failed to load your causes"
    : "";
  const { toast, showSuccess, showError, closeToast } = useToast();

  // جاي من "Volunteer Capacity by Cause" بالداشبورد (راجع
  // OpportunitiesBreakdownChart.jsx) — الـ id يوصل عبر router state
  // بدل query param، فما في أي أثر على الـ URL هون
  const highlightOpportunityId = location.state?.highlightOpportunityId ?? null;
  const [highlightedId, setHighlightedId] = useState(null);
  // حارس يمنع تكرار التمرير/التمييز لنفس الطلب أكتر من مرة (مثلًا لو
  // الصفحة أعادت الرندر لسبب تاني بعد ما خلص التمييز أصلًا)
  const highlightHandledRef = useRef(false);
  // مقبض DOM لكل كارد ظاهر حاليًا، بمفتاح id — نحتاجه بس لـ scrollIntoView
  const cardRefs = useRef({});

  useEffect(() => {
    highlightHandledRef.current = false;
  }, [highlightOpportunityId]);

  useEffect(() => {
    if (!highlightOpportunityId || loading || highlightHandledRef.current) return;

    const isCurrentlyVisible = visibleOpportunities.some((item) => item.id === highlightOpportunityId);

    if (!isCurrentlyVisible) {
      // موجودة بالقائمة الكاملة بس لسا مخفية خلف "Show more" — نكشفها
      // تلقائيًا بدل ما التمرير يفشل بصمت رغم إنها موجودة فعليًا
      const existsInFullList = opportunities.some((item) => item.id === highlightOpportunityId);
      if (existsInFullList && hasMore) showMore();
      // مش موجودة أصلًا بالقائمة الحالية (اتحذفت مثلًا) — نتجاهل التمرير بصمت
      return;
    }

    highlightHandledRef.current = true;

    // استدعاء setState مباشرة بجسم الـ Effect بيسبب cascading render
    // (راجع react-hooks/set-state-in-effect) — نجدولها عبر setTimeout(…, 0)
    // بدل هيك: نفس النتيجة (التمييز يبدأ فورًا عمليًا)، بس كـ استدعاء غير
    // متزامن مقبول، مش استدعاء متزامن بجسم الـ Effect نفسه
    const revealTimeoutId = setTimeout(() => {
      setHighlightedId(highlightOpportunityId);
      cardRefs.current[highlightOpportunityId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);

    const clearTimeoutId = setTimeout(() => setHighlightedId(null), 2500);

    return () => {
      clearTimeout(revealTimeoutId);
      clearTimeout(clearTimeoutId);
    };
  }, [highlightOpportunityId, loading, visibleOpportunities, opportunities, hasMore, showMore]);

  const handleDelete = async (id) => {
    const result = await deleteMutation.mutateAsync(id);
    if (!result.success) {
      showError(result.error || "Failed to delete this cause");
      return;
    }
    // أول مرة هالفعل بيعطي تأكيد واضح — قبلها كان الكارد يختفي بصمت
    // بدون أي إشارة للمستخدم إنه الحذف نجح فعلًا
    showSuccess("Cause deleted successfully.");
  };

  const handleToggleStatus = async (id, status) => {
    const result = await toggleStatusMutation.mutateAsync({ id, status });
    if (!result?.success) {
      showError(result?.error || "Failed to update this cause's status");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <VerificationStatusBanner status={status} rejectionReason={rejectionReason} hasLoadError={hasLoadError} />

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <Typography variant="sectionTitle" className="mb-2">
            My Causes
          </Typography>
          <Typography variant="body" className="text-body">
            Manage the volunteering opportunities you've published.
          </Typography>
        </div>

        {!loading && opportunities.length > 0 && (
          <div className="flex flex-col items-end gap-1">
            <Button
              onClick={() => navigate(ROUTES.CREATE_CAUSE)}
              disabled={!isVerified}
              className="flex items-center gap-2"
            >
              <Plus size={18} />
              New Cause
            </Button>
            {!isVerified && (
              <p className="text-xs text-heading/50">Available once your organization is verified</p>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-danger bg-danger/5 px-4 py-3 text-sm text-danger">
          <p>{error}</p>
          <Button variant="danger" size="small" onClick={() => opportunitiesQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title={
            isVerified
              ? "Your organization hasn't published any causes yet."
              : "You haven't posted any causes yet"
          }
          description={
            isVerified
              ? "Create your first volunteering opportunity to start receiving applicants."
              : "Once your organization is verified, you'll be able to publish your first cause."
          }
          actionLabel={isVerified ? "Create Your Organization's First Cause" : undefined}
          onAction={isVerified ? () => navigate(ROUTES.CREATE_CAUSE) : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {visibleOpportunities.map((opportunity) => (
              <MyCauseCard
                key={opportunity.id}
                ref={(node) => {
                  cardRefs.current[opportunity.id] = node;
                }}
                opportunity={opportunity}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                isVerified={isVerified}
                isHighlighted={opportunity.id === highlightedId}
              />
            ))}
          </div>
          {hasMore && <ShowMoreButton remainingCount={remainingCount} onClick={showMore} />}
        </>
      )}

      <Toast
        message={toast.message}
        variant={toast.variant}
        duration={7000}
        onClose={closeToast}
      />
    </div>
  );
}