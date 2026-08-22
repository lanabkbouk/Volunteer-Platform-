import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../context/AuthContext";
import { useOrganizationProfileQuery } from "../hooks/queries/useOrganizationProfileQuery";
import { useUpdateOrganizationProfileMutation } from "../hooks/queries/useUpdateOrganizationProfileMutation";
import { useImageUpload } from "../hooks/useImageUpload";
import useUnsavedChangesGuard from "../hooks/useUnsavedChangesGuard";
import { queryKeys } from "../app/queryKeys";
import { organizationProfileSchema } from "../utils/auth/OrganizationProfileValidation";
import { ORGANIZATION_STATUS } from "../constants/organizationStatus";
import { PANEL_SURFACE } from "../utils/surfaceStyles";

import OrgProfileHeader from "../components/OrgProfile/ProfileHeader";
import OrgProfileForm from "../components/OrgProfile/ProfileForm";
import OrgProfilePreview from "../components/OrgProfile/ProfilePreview";
import VerificationStatusBanner from "../components/OrgProfile/VerificationStatusBanner";
import RejectedVerificationPanel from "../components/OrgProfile/RejectedVerificationPanel";
import Skeleton from "../components/ui/Skeleton";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Toast from "../components/common/Toast";
import AuthAlert from "../components/auth/AuthAlert";
import { useToast } from "../hooks/useToast";
import { getOrganizationId } from "../utils/auth/getOrganizationId";

export default function OrgProfile() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = getOrganizationId(user);

  const organizationQuery = useOrganizationProfileQuery(organizationId);
  // isLoading (isPending && isFetching) مش isPending لحالها: isPending
  // بتضل true للأبد لما الاستعلام يكون enabled:false (organizationId
  // غير متوفر بعد)، فكانت الصفحة بتعلق بالـ Skeleton بشكل دائم
  const isLoading = organizationQuery.isLoading;
  // fetchOrganizationProfile هلق بترمي (throw) عند الفشل متل باقي
  // دوال fetch* بالمشروع، فـ query.isError صار يشتغل فعليًا — راجع
  // services/organization.js
  const organization = organizationQuery.data ?? null;
  const loadError = organizationQuery.isError
    ? organizationQuery.error?.message || 'Failed to load organization profile'
    : '';

  const updateProfileMutation = useUpdateOrganizationProfileMutation(organizationId);

  // useImageUpload يتكفّل بالمعاينة المحلية والتحقق من نوع/حجم الصورة —
  // نفس الـ hook المستخدم بصفحة Register وorgForm، بدل FileReader يدوي
  // مكرر هون لحاله
  const imageUpload = useImageUpload();
  const imagePreview = imageUpload.previewUrl;

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

  // نحجز التنقّل بس لما فيه تعديلات فعلية غير محفوظة، وما نحجزه أثناء
  // عملية الحفظ نفسها — نفس نمط volunteerProfile.jsx بالضبط
  //
  // ⚠️ imageUpload مش جزء من react-hook-form (methods.formState.isDirty)
  // إطلاقًا — بدون تضمينه هون صراحة، اختيار شعار جديد أو إزالته وعدم
  // الضغط على "Save" كان بيسمح للمنظمة تبارح الصفحة بصمت تام بدون أي
  // تحذير، فيضيع الشعار المختار
  const hasUnsavedImageChange = Boolean(imageUpload.file) || imageUpload.removed;
  const unsavedChangesBlocker = useUnsavedChangesGuard(
    (methods.formState.isDirty || hasUnsavedImageChange) && !updateProfileMutation.isPending
  );

  const onSubmit = async (data) => {
    try {
      // بناء FormData صار مسؤولية طبقة الخدمة (services/organization.js)
      // بدل الصفحة — نفس نمط buildOpportunityFormData. نمرّر الشعار هون
      // كمان (values/photoFile/removePhoto) — نفس شكل استدعاء
      // updateVolunteerProfile بالضبط، للتوحيد بين الصفحتين
      const result = await updateProfileMutation.mutateAsync({
        values: data,
        photoFile: imageUpload.file,
        removePhoto: imageUpload.removed,
      });

      if (!result.success) {
        showError(result.error || "Failed to save changes");
        return;
      }

      // نصفّر حالة الصورة (file/removed) بعد نجاح الحفظ — وإلا حارس
      // التنقّل فوق رح يضل يحذّر حتى بعد ما الحفظ نجح فعليًا (نفس
      // السبب بالضبط بـ volunteerProfile.jsx)
      const savedImageUrl = result.data?.imageUrl ?? (imageUpload.removed ? "" : imageUpload.previewUrl);
      imageUpload.reset(savedImageUrl);

      updateUser({ ...user, ...data, imageUrl: savedImageUrl });

      // ندمج قيم الفورم المحفوظة مباشرة بكاش React Query — وإلا رأس
      // الصفحة (الاسم، الشارة) يضل عارض البيانات القديمة للأبد بنفس
      // الجلسة، رغم إنه الحفظ نجح فعليًا بالتخزين. الشكل هون مسطّح
      // مباشرة (بدون {success,data}) — نفس شكل fetchOrganizationProfile
      // الحقيقي هلق بعد ما صار يرمي (throw) بدل ما يرجّع {success,...}
      queryClient.setQueryData(queryKeys.organization.profile(organizationId), (current) => ({
        ...(current ?? {}),
        ...data,
        imageUrl: savedImageUrl,
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
      <div className="mx-auto w-full flex-1 max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto px-4 md:px-16 py-10 md:py-14">
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
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="mx-auto w-full flex-1 max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto px-4 md:px-16 py-10 md:py-14">

          {loadError && (
            <div className="mb-4">
              <AuthAlert variant="error">{loadError}</AuthAlert>
            </div>
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

          <OrgProfileHeader
            name={organization?.name}
            imagePreview={imagePreview}
            onImageChange={imageUpload.handleFileChange}
            onImageRemove={imageUpload.handleRemove}
            status={organization?.status}
            imageError={imageUpload.error}
          />

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
      </div>

      {/* نافذة تأكيد المغادرة — تظهر بس لما فيه تعديلات غير محفوظة
          (نص أو شعار) والمنظمة حاولت تنتقل لصفحة تانية (رابط أو زر
          رجوع المتصفح) — نفس نمط volunteerProfile.jsx بالضبط */}
      <Modal
        open={unsavedChangesBlocker.state === "blocked"}
        onClose={() => unsavedChangesBlocker.reset?.()}
        title="Unsaved changes"
        footer={
          <>
            <Button variant="ghost" onClick={() => unsavedChangesBlocker.reset?.()}>
              Stay on this page
            </Button>
            <Button variant="danger" onClick={() => unsavedChangesBlocker.proceed?.()}>
              Leave without saving
            </Button>
          </>
        }
      >
        You have unsaved changes to your organization profile. If you leave now, these changes will be lost.
      </Modal>

      <Toast
        message={toast.message}
        variant={toast.variant}
        duration={7000}
        onClose={closeToast}
      />
    </FormProvider>
  );
}