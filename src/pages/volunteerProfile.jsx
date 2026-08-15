import { useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSkillsQuery } from "../hooks/queries/useSkillsQuery";
import { useUpdateVolunteerProfileMutation } from "../hooks/queries/useUpdateVolunteerProfileMutation";
import { useImageUpload } from "../hooks/useImageUpload";
import { useToast } from "../hooks/useToast";
import { PANEL_SURFACE } from "../utils/surfaceStyles";

import ProfileHeader from "../components/volunteerProfile/ProfileHeader";
import ProfileForm from "../components/volunteerProfile/ProfileForm";
import ProfilePreview from "../components/volunteerProfile/ProfilePreview";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Toast from "../components/common/Toast";
import useUnsavedChangesGuard from "../hooks/useUnsavedChangesGuard";
import { profileSchema } from "../utils/auth/VolunteerProfileValidation";

const normalizeGenderFromUser = (gender) => {
  if (!gender) return "";
  const g = String(gender).toLowerCase();
  if (g === "female" || g === "f") return "Female";
  if (g === "male" || g === "m") return "Male";
  if (g.includes("prefer") || g.includes("not")) return "Prefer not to say";
  return gender;
};

export default function VolunteerProfile() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const guardMessage = location.state?.message || '';

  // نفس هوك المهارات مستخدم هون وبـ ProfilePreview سوا — بفضل الكاش
  // المشترك ما بتنجلب مرتين حتى لو الاثنين رندروا بنفس اللحظة
  const skillsQuery = useSkillsQuery();
  const availableSkills = skillsQuery.data ?? [];
  const skillsLoading = skillsQuery.isPending;

  const updateProfileMutation = useUpdateVolunteerProfileMutation(user?.id);

  // useImageUpload يتكفّل بالمعاينة المحلية والتحقق من نوع/حجم الصورة —
  // نفس الـ hook المستخدم بصفحة Register وorgForm، بدل FileReader يدوي
  // مكرر هون لحاله. user متوفر فورًا من AuthContext (بعكس orgProfile
  // يلي بينتظر React Query)، فمنقدر نمرر قيمة أولية مباشرة
  const imageUpload = useImageUpload(user?.imageUrl || "");
  // لو المستخدم انتقل هون بسبب حارس تنقّل (مثلًا بروفايل ناقص)، بتوصل
  // رسالة جاهزة عبر location.state — منستخدمها كقيمة ابتدائية لنفس الـ
  // Toast يلي هيك رح يعرض لاحقًا نتيجة الحفظ، بدل Toast منفصل لكل حالة
  const { toast, showSuccess, showError, closeToast } = useToast({
    message: guardMessage,
    variant: "info",
  });

  const defaultValues = useMemo(
    () => ({
      educationLevel: user?.educationLevel || "",
      dateOfBirth: user?.dateOfBirth || user?.dob || "",
      gender: normalizeGenderFromUser(user?.gender),
      city: user?.city || "",
      skills: Array.isArray(user?.skillIds) ? user?.skillIds : [],
      interests: Array.isArray(user?.interests)
        ? user?.interests.join(", ")
        : user?.interests || "",
      about: user?.about || user?.bio || "",
    }),
    [user]
  );

  const methods = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: "onSubmit",
  });

  // نحجز التنقّل بس لما فيه تعديلات فعلية غير محفوظة، وما نحجزه أثناء
  // عملية الحفظ نفسها (submitting) حتى ما يعلق المستخدم بمنتصف الحفظ
  //
  // ⚠️ imageUpload مش جزء من react-hook-form (methods.formState.isDirty)
  // إطلاقًا — هو state منفصل بالكامل (useImageUpload). بدون تضمينه هون
  // صراحة، اختيار صورة جديدة أو إزالتها وعدم الضغط على "Save" كان
  // بيسمح للمستخدم يبارح الصفحة بصمت تام بدون أي تحذير، فتضيع الصورة
  const hasUnsavedImageChange = Boolean(imageUpload.file) || imageUpload.removed;
  const unsavedChangesBlocker = useUnsavedChangesGuard(
    (methods.formState.isDirty || hasUnsavedImageChange) && !updateProfileMutation.isPending
  );

  const fullName = user?.displayName;

  const onSubmit = async (data) => {
    try {
      const result = await updateProfileMutation.mutateAsync({
        values: data,
        photoFile: imageUpload.file,
        removePhoto: imageUpload.removed,
      });

      if (!result.success) {
        showError(result.error || "Failed to save profile");
        return;
      }

      showSuccess("Profile saved successfully.");

      // نصفّر حالة "isDirty" بعد نجاح الحفظ — وإلا حارس التنقّل الجديد
      // (useUnsavedChangesGuard) رح يضل يحذّر المستخدم حتى بعد ما حفظ فعليًا
      methods.reset(data);

      // نفس الشي لحالة الصورة (file/removed) — بدون هالسطر، لو حفظتِ
      // صورة جديدة بنجاح، imageUpload.file كان رح يضل "معلّق" للأبد،
      // وحارس التنقّل فوق رح يستمر يحذّر بالغلط حتى إنه الحفظ نجح فعليًا
      const savedImageUrl = result.data?.imageUrl ?? (imageUpload.removed ? "" : imageUpload.previewUrl);
      imageUpload.reset(savedImageUrl);

      // نحدّث الجلسة بالحقول المحفوظة فعليًا. RequireCompleteProfile
      // رح يفحص هالحقول نفسها مباشرة (مو علم منفصل) عبر
      // isVolunteerProfileComplete، فبمجرد ما تتحدث هون بيتحدث قرار
      // الاكتمال تلقائيًا بدون أي خطوة إضافية
      updateUser({
        ...data,
        skillIds: data.skills,
        imageUrl: savedImageUrl,
      });
    } catch (err) {
      showError(err.message || "Failed to save profile");
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="mx-auto w-full flex-1 max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto px-4 md:px-16 py-10 md:py-14">
          <ProfileHeader
            fullName={fullName}
            gender={methods.watch("gender")}
            imagePreview={imageUpload.previewUrl}
            onImageChange={imageUpload.handleFileChange}
            onImageRemove={imageUpload.handleRemove}
          />

          {imageUpload.error && (
            <p className="mt-2 text-sm text-danger">{imageUpload.error}</p>
          )}

          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className={`lg:col-span-2 ${PANEL_SURFACE} p-6 md:p-8`}>
              <ProfileForm
                submitting={updateProfileMutation.isPending}
                availableSkills={availableSkills}
                skillsLoading={skillsLoading}
              />
            </div>

            {/*  رير المهارات للـ Preview */}
            <ProfilePreview
              fullName={fullName}
              email={user?.email}
              phone={user?.phone}
              availableSkills={availableSkills}
            />
          </form>
        </div>
      </div>

      {/* نافذة تأكيد المغادرة — تظهر بس لما فيه تعديلات غير محفوظة
          والمتطوع حاول ينتقل لصفحة تانية (رابط أو زر رجوع المتصفح) */}
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
        You have unsaved changes to your profile. If you leave now, these changes will be lost.
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