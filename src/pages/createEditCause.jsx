import { useEffect } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import Typography from "../components/ui/Typography";
import Button from "../components/ui/Button";
import CauseForm from "../components/organization/CauseForm";
import OpportunityPreviewCard from "../components/opportunity/OpportunityPreviewCard";
import Skeleton from "../components/ui/Skeleton";
import VerificationStatusBanner from "../components/OrgProfile/VerificationStatusBanner";
import Toast from "../components/common/Toast";
import { useAuth } from "../context/AuthContext";
import { useOrganizationVerification } from "../hooks/useOrganizationVerification";
import { useCategoriesQuery } from "../hooks/queries/useCategoriesQuery";
import { useSkillsQuery } from "../hooks/queries/useSkillsQuery";
import { useOpportunityDetailsQuery } from "../hooks/queries/useOpportunityDetailsQuery";
import { useSaveOpportunityMutation } from "../hooks/queries/useSaveOpportunityMutation";
import { useImageUpload } from "../hooks/useImageUpload";
import { useToast } from "../hooks/useToast";
import { opportunitySchema } from "../utils/opportunityValidation";
import { isOrganizationProfileComplete } from "../utils/auth/profileCompletion";
import { ROUTES } from "../constants/paths";
import { getOrganizationId } from "../utils/auth/getOrganizationId";
import { PANEL_SURFACE } from "../utils/surfaceStyles";

// لوحة المعاينة الحية: تقرأ قيم الفورم لحظة بلحظة عبر useWatch وتعرضها
// بنفس شكل OpportunityCard الحقيقي يلي المتطوع رح يشوفه بقائمة الفرص.
// مكوّن منفصل صغير (مو منطق جوا CreateEditCause نفسه) عشان useWatch
// يعيد رندر بس هالجزء لحظة كتابة أي حرف، بدل الصفحة كلها
function CausePreviewPanel({ categories, imagePreview }) {
  const values = useWatch();
  const selectedCategory = categories.find((category) => category.id === values.categoryId);

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-20 flex flex-col gap-3">
        <Typography variant="overline" className="px-1">
          Live Preview — how volunteers will see this cause
        </Typography>
        <OpportunityPreviewCard
          title={values.title}
          description={values.description}
          imagePreview={imagePreview}
          categoryName={selectedCategory?.name}
          location={values.city}
          minHours={values.minHours}
          maxHours={values.maxHours}
          maxVolunteers={values.maxVolunteers}
        />
      </div>
    </div>
  );
}

const DEFAULT_VALUES = {
  title: "",
  description: "",
  categoryId: "",
  city: "",
  skills: [],
  startDate: "",
  endDate: "",
  registerStartAt: "",
  registerEndAt: "",
  minHours: "",
  maxHours: "",
  totalHours: "",
  minVolunteers: "",
  maxVolunteers: "",
  // اختياري، افتراضيًا false — راجع opportunityValidation.js وCauseForm.jsx
  isGroup: false,
};

export default function CreateEditCause() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const organizationId = getOrganizationId(user);
  const { status, rejectionReason, isVerified, hasLoadError, organization } = useOrganizationVerification();

  // نفس هوك التصنيفات المستخدم بصفحتي الفرص — كاش مشترك، ما بينجلب مرتين
  const categoriesQuery = useCategoriesQuery();
  // نفس هوك المهارات المستخدم بفورم بروفايل المتطوع — لتحديد المهارات
  // المطلوبة من المتطوعين بهاي الفرصة (خوارزمية الاقتراح تعتمد عليها)
  const skillsQuery = useSkillsQuery();
  // بوضع "تعديل" بس: id موجود فبيتفعّل الجلب تلقائيًا (enabled: Boolean(id)
  // داخل الهوك نفسه) — بوضع "إنشاء" الهوك معطّل تلقائيًا بدون أي شرط هون
  const opportunityQuery = useOpportunityDetailsQuery(id);
  // organizationId/organizationName لازمين بس وقت الإنشاء — الهوك نفسه
  // بيتجاهلهم بوضع التعديل (راجع useSaveOpportunityMutation)
  const saveMutation = useSaveOpportunityMutation({
    isEditMode,
    id,
    organizationId,
    organizationName: user?.orgName,
  });

  const categories = categoriesQuery.data ?? [];
  const availableSkills = skillsQuery.data ?? [];
  const opportunity = opportunityQuery.data?.opportunity ?? null;

  const { toast, showSuccess, showError, closeToast } = useToast();

  const {
    previewUrl: imagePreview,
    error: imageError,
    handleFileChange,
    file: imageFile,
    setPreviewUrl,
  } = useImageUpload();

  const methods = useForm({
    resolver: zodResolver(opportunitySchema),
    defaultValues: DEFAULT_VALUES,
  });

  // نزامن الفورم ومعاينة الصورة مع بيانات الفرصة أول ما توصل — بوضع
  // "تعديل" بس. useEffect هون شرعي لأنه بيربط بيانات React Query مع
  // نظامين خارجيين (react-hook-form وuseImageUpload)، مو جلب بيانات بحد ذاته
  useEffect(() => {
    if (!isEditMode || !opportunity) return;

    methods.reset({
      title: opportunity.title,
      description: opportunity.description,
      categoryId: opportunity.category?.id || "",
      city: opportunity.location,
      skills: opportunity.skills?.map((skill) => skill.id) || [],
      startDate: opportunity.startDate,
      endDate: opportunity.endDate,
      registerStartAt: opportunity.registerStartAt || "",
      registerEndAt: opportunity.registerEndAt || "",
      minHours: opportunity.minHours,
      maxHours: opportunity.maxHours,
      totalHours: opportunity.totalHours,
      minVolunteers: opportunity.minVolunteers,
      maxVolunteers: opportunity.maxVolunteers,
      isGroup: opportunity.isGroup || false,
    });

    if (opportunity.image) setPreviewUrl(opportunity.image);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity, isEditMode]);

  const loading = isEditMode
    ? categoriesQuery.isPending || skillsQuery.isPending || opportunityQuery.isPending
    : categoriesQuery.isPending || skillsQuery.isPending;

  // فشل أي من طلبات التحميل (تصنيفات/مهارات/بيانات الفرصة بوضع التعديل)
  // لازم يظهر كخطأ صريح — وإلا الفورم بيترندر فاضي بصمت (خصوصًا بوضع
  // التعديل: useEffect المزامنة فوق بيتوقف عن التعبئة لو opportunity فشل)
  const loadError = categoriesQuery.isError
    ? categoriesQuery.error?.message || "Failed to load categories"
    : skillsQuery.isError
      ? skillsQuery.error?.message || "Failed to load skills"
      : isEditMode && opportunityQuery.isError
        ? opportunityQuery.error?.message || "Failed to load this cause"
        : "";

  const handleRetryLoad = () => {
    categoriesQuery.refetch();
    skillsQuery.refetch();
    if (isEditMode) opportunityQuery.refetch();
  };

  const onSubmit = async (values) => {
    const selectedCategory = categories.find((category) => category.id === values.categoryId);
    // حماية دفاعية: لو الحقل ما وصل مسجَّل لأي سبب (مثلاً فورم قديم بدون
    // SkillsSelector) منرجع مصفوفة فاضية بدل ما ينهار onSubmit بالكامل
    const selectedSkillIds = Array.isArray(values.skills) ? values.skills : [];
    const selectedSkills = availableSkills
      .filter((skill) => selectedSkillIds.includes(skill.id))
      .map((skill) => ({ id: skill.id, name: skill.name }));

    const payload = {
      ...values,
      category: selectedCategory ? { id: selectedCategory.id, name: selectedCategory.name } : null,
      skills: selectedSkills,
      location: values.city,
      imageFile,
    };

    const result = await saveMutation.mutateAsync(payload);

    if (!result.success) {
      showError(result.error || "Something went wrong");
      return;
    }

    // نعرض تأكيد نجاح واضح للمستخدم قبل ما ننتقل، بدل انتقال صامت فوري
    // ما بيعطي أي إحساس إنه الحفظ صار فعلًا
    showSuccess(isEditMode ? "Changes saved successfully." : "Cause published successfully.");
    setTimeout(() => navigate(ROUTES.MY_CAUSES), 900);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-4 w-80 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-start gap-3 rounded-lg border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          <p>{loadError}</p>
          <Button variant="danger" size="small" onClick={handleRetryLoad}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <VerificationStatusBanner status={status} rejectionReason={rejectionReason} hasLoadError={hasLoadError} />

      <Typography variant="sectionTitle" className="mb-2">
        {isEditMode ? "Edit Cause" : "Create a New Cause"}
      </Typography>
      <Typography variant="body" className="mb-8 text-body">
        {isEditMode
          ? "Update the details of this volunteering opportunity."
          : "Publish a new volunteering opportunity for people to join."}
      </Typography>

      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
        >
          {/* عمودا الفورم: نفس نمط PANEL_SURFACE المستخدم بصفحة بروفايل
              المتطوع، عشان الصفحتين تعطيا نفس الإحساس البصري بمكان
              التعديل الفعلي */}
          <div className={`lg:col-span-2 ${PANEL_SURFACE} p-6 md:p-8`}>
            <CauseForm
              categories={categories}
              availableSkills={availableSkills}
              skillsLoading={skillsQuery.isPending}
              submitting={saveMutation.isPending}
              submitDisabled={!isVerified}
              submitLabel={isEditMode ? "Save Changes" : "Publish Cause"}
              imagePreview={imagePreview}
              imageError={imageError}
              onImageChange={handleFileChange}
              profileIncomplete={Boolean(organization) && !isOrganizationProfileComplete(organization)}
            />
            {!isVerified && (
              <p className="text-sm text-heading/50 mt-4">
                You can prepare this cause now, but publishing requires your organization to be
                verified first.
              </p>
            )}
          </div>

          {/* العمود الثالث: معاينة حية لكارد الفرصة بالضبط متل ما رح
              يظهر للمتطوعين */}
          <CausePreviewPanel categories={categories} imagePreview={imagePreview} />
        </form>
      </FormProvider>

      <Toast
        message={toast.message}
        variant={toast.variant}
        duration={7000}
        onClose={closeToast}
      />
    </div>
  );
}