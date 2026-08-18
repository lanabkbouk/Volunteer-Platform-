import { useFormContext, Controller } from "react-hook-form";
import { Link } from "react-router-dom";
import { MapPin, Tag, ImagePlus, AlertTriangle } from "lucide-react";
import Input from "../ui/Input";
import Dropdown from "../ui/Dropdown";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";
import Typography from "../ui/Typography";
import SkillsSelector from "../common/SkillsSelector";
import { SYRIAN_GOVERNORATES } from "../../services/syrianGovernorates";
import { getCategoryLabel } from "../../utils/categoryStyles";
import { ROUTES } from "../../constants/paths";
import { FIELD_LABEL, FIELD_ERROR } from "../../utils/fieldStyles";

const GOVERNORATE_ITEMS = SYRIAN_GOVERNORATES.map(({ nameEn }) => ({
  name: nameEn,
  value: nameEn === "Rural Damascus" ? "Rif Dimashq" : nameEn,
}));

// عنوان قسم فرعي موحّد داخل الفورم — بدل تكرار نفس كلاسات Typography
// بكل قسم على حدة (نفس مبدأ DRY المتبع بباقي المشروع)
function FormSection({ title, description, children }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h5" className="pb-2 border-b border-heading/10">
          {title}
        </Typography>
        {description && (
          <Typography variant="caption" color="muted" className="mt-2 block">
            {description}
          </Typography>
        )}
      </div>
      {children}
    </div>
  );
}

export default function CauseForm({
  categories,
  availableSkills = [],
  skillsLoading = false,
  submitting,
  submitDisabled = false,
  submitLabel = "Publish Cause",
  imagePreview,
  onImageChange,
  imageError,
  // تحذير غير مانع بس (مو خطأ) — بروفايل المنظمة (وصف/مدينة) ناقص، فمنطقيًا
  // بيأثر على شكل ظهور الفرصة بصفحتها العامة. لا يعطّل الزر ولا يمنع الحفظ.
  profileIncomplete = false,
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const categoryItems = categories.map((category) => ({
    name: getCategoryLabel(category.name),
    value: category.id,
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* تحذير غير مانع: بروفايل المنظمة ناقص (وصف أو مدينة) — بلون تحذيري
          (عنبري) مش أحمر، وبدون تعطيل زر الحفظ إطلاقًا. معروض أول شي بالفورم
          حتى تقرر المنظمة قبل ما تعبي كل الحقول، مش كملاحظة أخيرة قبل الحفظ */}
      {profileIncomplete && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p className="text-sm">
            Your organization profile is incomplete. We recommend{" "}
            <Link to={ROUTES.ORGANIZATION_PROFILE} className="font-medium underline underline-offset-2">
              completing your profile
            </Link>{" "}
            first so this cause displays fully on its public page.
          </p>
        </div>
      )}

      {/* القسم الأول: المعلومات الأساسية — العنوان، الوصف، صورة الغلاف،
          والموقع/التصنيف — كل ما يحدد هوية الفرصة الأساسية سوا بقسم واحد،
          أول شي بيشوفه المتطوع بالكارد، فمنطقيًا أول شي نطلبه هون */}
      <FormSection title="Basic Information">
        {/* صورة الفرصة — اختيارية، تُعرض بكارد الفرصة والقائمة إن وُجدت.
            دروب-زون أكبر وأوضح من مجرد أيقونة صغيرة، لأنها أهم عنصر
            بصري بالفرصة (أول شي يجذب نظر المتطوع بقائمة الفرص) */}
        <div className="flex flex-col gap-1">
          <label className={FIELD_LABEL}>Cover Image (optional)</label>
          <label
            htmlFor="cause-image"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-heading/20 bg-heading/5 px-4 py-8 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition text-center"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Cover preview"
                className="h-32 w-full max-w-md rounded-xl object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-heading/10 flex items-center justify-center text-heading/40">
                <ImagePlus size={26} />
              </div>
            )}
            <span className="text-sm text-body">
              {imagePreview ? "Click to change image" : "Click to upload a cover image (JPG or PNG)"}
            </span>
          </label>
          <input id="cause-image" type="file" accept="image/*" className="hidden" onChange={onImageChange} />
          {imageError && <p className={FIELD_ERROR}>{imageError}</p>}
        </div>

        <Input
          label="Title"
          name="title"
          register={register}
          error={errors.title?.message}
          placeholder="e.g. Clean Water for All"
          required
        />

        <Textarea
          label="Description"
          name="description"
          register={register}
          placeholder="Describe what volunteers will do, and why it matters..."
          error={errors.description?.message}
          className="min-h-[140px]"
          required
        />

        {/* الموقع والتصنيف — يحددان وين ولمين بتظهر الفرصة (فلاتر البحث
            بقائمة الفرص تعتمد عليهم مباشرة). مدموجين هون جوا "Basic
            Information" (مو قسم مستقل لحالهم) لأنهم معلومات أساسية تعرّف
            الفرصة زي العنوان والوصف تمامًا، بدون داعي لعنوان قسم كامل
            لحقلين بس */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Controller
            name="categoryId"
            control={control}
            defaultValue=""
            render={({ field: { value, onChange } }) => (
              <Dropdown
                label="Category"
                items={categoryItems}
                value={value}
                onChange={onChange}
                placeholder="Select a category"
                icon={Tag}
                error={errors.categoryId?.message}
                required
              />
            )}
          />

          <Controller
            name="city"
            control={control}
            defaultValue=""
            render={({ field: { value, onChange } }) => (
              <Dropdown
                label="Governorate"
                items={GOVERNORATE_ITEMS}
                value={value}
                onChange={onChange}
                placeholder="Select a governorate"
                icon={MapPin}
                error={errors.city?.message}
                required
              />
            )}
          />
        </div>
      </FormSection>

      {/* القسم الثاني: المهارات المطلوبة — تُستخدم بخوارزمية اقتراح
          الفرص للمتطوعين المناسبين (مع العمر والمدينة) */}
      <FormSection
        title="Required Skills"
        description="Volunteers whose profile matches these skills will see this cause recommended to them."
      >
        <SkillsSelector
          control={control}
          name="skills"
          availableSkills={availableSkills}
          loading={skillsLoading}
          error={errors.skills?.message}
          helperText="Select at least one skill volunteers should have"
        />
      </FormSection>

      {/* القسم الثالث: الجدول الزمني ونافذة التسجيل */}
      <FormSection
        title="Schedule & Registration Window"
        description="The registration window must close on or before the opportunity's start date."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            label="Start Date"
            name="startDate"
            type="date"
            register={register}
            error={errors.startDate?.message}
            required
          />
          <Input
            label="End Date"
            name="endDate"
            type="date"
            register={register}
            error={errors.endDate?.message}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            label="Registration Start Date"
            name="registerStartAt"
            type="date"
            register={register}
            error={errors.registerStartAt?.message}
            required
          />
          <Input
            label="Registration End Date"
            name="registerEndAt"
            type="date"
            register={register}
            error={errors.registerEndAt?.message}
            required
          />
        </div>
      </FormSection>

      {/* القسم الرابع: ساعات التطوع والسعة */}
      <FormSection title="Hours & Capacity">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Input
            label="Min Hours (per volunteer)"
            name="minHours"
            type="number"
            min="1"
            register={register}
            error={errors.minHours?.message}
            required
          />
          <Input
            label="Max Hours (per volunteer)"
            name="maxHours"
            type="number"
            min="1"
            register={register}
            error={errors.maxHours?.message}
            required
          />
          <Input
            label="Total Hours (whole cause)"
            name="totalHours"
            type="number"
            min="1"
            register={register}
            error={errors.totalHours?.message}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            label="Min Volunteers"
            name="minVolunteers"
            type="number"
            min="1"
            register={register}
            error={errors.minVolunteers?.message}
            required
          />
          <Input
            label="Max Volunteers"
            name="maxVolunteers"
            type="number"
            min="1"
            register={register}
            error={errors.maxVolunteers?.message}
            required
          />
        </div>

        {/* اختياري، افتراضيًا false — يغذّي منطق إنجاز "3 أنشطة جماعية"
            الموجود بالفعل بالباك اند (AchievementService::checkThreeGroupActivities)،
            فمنظمة بتعلّم الفرصة كـ "جماعية" بتساعد المتطوعين يفتحوا هالإنجاز */}
        <label className="flex items-center gap-3 rounded-xl border border-heading/10 p-4 cursor-pointer">
          <input
            type="checkbox"
            {...register("isGroup")}
            className="h-5 w-5 rounded border-heading/20 text-primary focus:ring-primary/30"
          />
          <div>
            <Typography variant="bodySm" className="font-medium text-heading">
              Group opportunity
            </Typography>
            <Typography variant="caption" color="muted" className="mt-0.5 block">
              Volunteers take part together as a group, rather than individually.
            </Typography>
          </div>
        </label>
      </FormSection>

      <Button
        type="submit"
        size="large"
        isLoading={submitting}
        loadingText="Saving..."
        disabled={submitDisabled}
        className="self-start"
      >
        {submitLabel}
      </Button>
    </div>
  );
}