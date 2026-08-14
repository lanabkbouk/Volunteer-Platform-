import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../context/AuthContext";
import { useOrganizationProfileQuery } from "../hooks/queries/useOrganizationProfileQuery";
import { useUpdateOrganizationProfileMutation } from "../hooks/queries/useUpdateOrganizationProfileMutation";
import { useImageUpload } from "../hooks/useImageUpload";
import { queryKeys } from "../app/queryKeys";
import { organizationProfileSchema } from "../utils/auth/OrganizationProfileValidation";
import { ORGANIZATION_STATUS } from "../constants/organizationStatus";
import { PANEL_SURFACE } from "../utils/surfaceStyles";
import { markOrganizationStatusSeen } from "../utils/organizationVerificationSeenTracker";

import OrgProfileHeader from "../components/OrgProfile/ProfileHeader";
import OrgProfileForm from "../components/OrgProfile/ProfileForm";
import OrgProfilePreview from "../components/OrgProfile/ProfilePreview";
import VerificationStatusBanner from "../components/OrgProfile/VerificationStatusBanner";
import RejectedVerificationPanel from "../components/OrgProfile/RejectedVerificationPanel";
import ProfileCompletionReminderBanner from "../components/OrgProfile/ProfileCompletionReminderBanner";
import Skeleton from "../components/ui/Skeleton";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import { getOrganizationId } from "../utils/auth/getOrganizationId";
import { isOrganizationProfileComplete } from "../utils/auth/profileCompletion";

export default function OrgProfile() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = getOrganizationId(user);

  const organizationQuery = useOrganizationProfileQuery(organizationId);
  // isLoading (isPending && isFetching) مش isPending لحالها: isPending
  // بتضل true للأبد لما الاستعلام يكون enabled:false (organizationId
  // غير متوفر بعد)، فكانت الصفحة بتعلق بالـ Skeleton بشكل دائم
  const isLoading = organizationQuery.isLoading;
  // الخدمة بترجع { success, data } دايمًا (ما بترمي استثناء)، فمنطق
  // التحقق يضل هون بدل الاعتماد على query.isError
  const organization = organizationQuery.data?.success ? organizationQuery.data.data : null;
  // isFetched (مو !isLoading): الاستعلام لازم يكون نفّذ فعليًا مرة عالأقل
  // قبل ما نعتبرها "فشلت" — نفس نمط dashboard.jsx بالضبط، حتى لا يظهر
  // الفورم فاضي بصمت عند فشل الجلب
  const loadError = organizationQuery.isFetched && !organizationQuery.data?.success
    ? organizationQuery.data?.error || "Unable to load your organization profile"
    : "";

  const updateProfileMutation = useUpdateOrganizationProfileMutation(organizationId);

  // useImageUpload يتكفّل بالمعاينة المحلية والتحقق من نوع/حجم الصورة —
  // نفس الـ hook المستخدم بصفحة Register وorgForm، بدل FileReader يدوي
  // مكرر هون لحاله
  const imageUpload = useImageUpload();
  const imagePreview = imageUpload.previewUrl || organization?.imageUrl || "";

  const { toast, showSuccess, showError, closeToast } = useToast();

  const methods = useForm({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: { name: "", description: "", city: "", website: "" },
    mode: "onSubmit",
  });

  // منزامن الفورم والمعاينة مع بيانات المنظمة أول ما توصل (أو تتحدّث)
  // من الكاش — useEffect هون شرعي لأنه بيربط نظامين مختلفين (React Query
  // وreact-hook-form) مع بعض، مو جلب بيانات بحد ذاته
  //
  // ملاحظة: imageUpload مش بالـ deps array عمدًا — كائن جديد بكل render
  // (دوال useCallback بس الكائن نفسه literal جديد)، فإضافته كانت رح
  // تشغّل الـ effect بكل render بدل بس لما organization تتغيّر فعليًا
  useEffect(() => {
    if (!organization) return;

    methods.reset({
      name: organization.name || "",
      description: organization.description || "",
      city: organization.city || "",
      website: organization.website || "",
    });

    imageUpload.setPreviewUrl(organization.imageUrl || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, methods]);

  // تعليم قرار التوثيق الحالي (verified/rejected) كـ"مشاهَد" — نفس منطق
  // markStatusSeen بـ participates.jsx بالضبط: أول ما المنظمة تشوف
  // حالتها هون فعليًا، تنبيه جرس الإشعارات المقابل بيختفي لحد ما يصير
  // قرار جديد فعليًا (راجع services/notifications.js)
  useEffect(() => {
    if (!organization?.id || !organization?.status) return;
    markOrganizationStatusSeen(organization.id, organization.status);
  }, [organization?.id, organization?.status]);

  const onSubmit = async (data) => {
    try {
      // بناء FormData صار مسؤولية طبقة الخدمة (services/organization.js)
      // بدل الصفحة — نفس نمط buildOpportunityFormData
      const result = await updateProfileMutation.mutateAsync(data);

      if (!result.success) {
        showError(result.error || "Failed to save changes");
        return;
      }

      updateUser({ ...user, ...data });

      // ندمج قيم الفورم المحفوظة مباشرة بكاش React Query — وإلا رأس
      // الصفحة (الاسم، الشارة) يضل عارض البيانات القديمة للأبد بنفس
      // الجلسة، رغم إنه الحفظ نجح فعليًا بالتخزين
      queryClient.setQueryData(queryKeys.organization.profile(organizationId), (current) => ({
        success: true,
        data: { ...(current?.data ?? {}), ...data },
      }));

      methods.reset(data);
      showSuccess("Changes saved successfully.");
    } catch (err) {
      showError(err.message || "Failed to save changes");
    }
  };

  const canUseServices = organization?.status === ORGANIZATION_STATUS.VERIFIED;
  const isRejected = organization?.status === ORGANIZATION_STATUS.REJECTED;

  if (isLoading) {
    return (
      <div className="mx-auto w-full flex-1 max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* هيكل تقريبي لرأس البروفايل: صورة دائرية + اسم + شارة حالة */}
        <div className={`flex flex-col md:flex-row md:items-center gap-8 ${PANEL_SURFACE} px-8 py-10`}>
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-xl" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
        </div>

        {/* هيكل تقريبي للنموذج + بطاقة المعاينة */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 ${PANEL_SURFACE} p-6 md:p-8 flex flex-col gap-5`}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className={`${PANEL_SURFACE} p-6 md:p-8 flex flex-col items-center gap-4`}>
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="mx-auto w-full flex-1 max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loadError && (
          <p className="mb-4 rounded-lg border border-danger bg-danger/5 px-3 py-2 text-sm text-danger">
            {loadError}
          </p>
        )}

        {isRejected ? (
          <RejectedVerificationPanel
            organizationId={organizationId}
            rejectionReason={organization?.rejectionReason}
            onUploadSuccess={showSuccess}
            onUploadError={showError}
          />
        ) : (
          <VerificationStatusBanner
            status={organization?.status}
            rejectionReason={organization?.rejectionReason}
          />
        )}

        {/* تذكير غير مانع لإكمال البروفايل — مستقل تمامًا عن حالة التوثيق
            (pending/rejected)، فبيظهر جنب أي بانر تاني فوق لو الوصف أو
            المدينة ناقصين */}
        {organization && !isOrganizationProfileComplete(organization) && (
          <ProfileCompletionReminderBanner />
        )}

        <OrgProfileHeader
          name={organization?.name}
          imagePreview={imagePreview}
          onImageChange={imageUpload.handleFileChange}
          status={organization?.status}
        />

        {imageUpload.error && (
          <p className="mt-2 text-sm text-danger">{imageUpload.error}</p>
        )}

        {/* FORM + PREVIEW */}
        <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
          {/* LEFT: FORM */}
          <div className={`lg:col-span-2 ${PANEL_SURFACE} p-6 md:p-8`}>
            <OrgProfileForm submitting={updateProfileMutation.isPending} />
          </div>

          {/* RIGHT: PREVIEW */}
          <OrgProfilePreview email={organization?.email} phone={user?.phone} />
        </form>

        {!canUseServices && (
          <p className="mt-4 text-xs text-body text-center">
            Opportunity posting will be available once your organization is verified.
          </p>
        )}
      </div>

      <Toast
        message={toast.message}
        variant={toast.variant}
        duration={7000}
        onClose={closeToast}
      />
    </FormProvider>
  );
}