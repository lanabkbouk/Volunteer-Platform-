import { useOrganizationProfileQuery } from "./queries/useOrganizationProfileQuery";
import { ORGANIZATION_STATUS, getOrganizationStatusMeta } from "../constants/organizationStatus";
import { useAuth } from "../context/AuthContext";
import { getOrganizationId } from "../utils/auth/getOrganizationId";

/**
 * يجلب حالة توثيق المنظمة الحالية، ليستخدمه أي صفحة (My Causes، إنشاء/تعديل
 * فرصة، قائمة المتقدمين، الداشبورد) لتعطيل الأزرار الفعلية فقط
 * (نشر/قبول/رفض/حذف/تعديل) دون حجب عرض الصفحة نفسها — المنظمة تشوف كل
 * شيء، وتُمنع فقط من التصرف الفعلي لحد ما تُوثَّق.
 *
 * ملاحظة مهمة: هاد الـ hook ما بيعمل طلب شبكة خاص فيه — هو غلاف رفيع
 * (thin wrapper) فوق useOrganizationProfileQuery، اللي بيعتمد على cache
 * React Query المشترك (queryKeys.organization.profile). هيك كل الصفحات
 * يلي بتستخدمه بتشارك نفس نسخة البيانات، وأي تحديث (مثلاً حفظ البروفايل
 * بصفحة orgProfile) بينعكس تلقائيًا على البقية بدون طلب شبكة إضافي.
 */
export function useOrganizationVerification() {
  const { user } = useAuth();
  const organizationId = getOrganizationId(user);
  const { data, isLoading, isError } = useOrganizationProfileQuery(organizationId);

  // fetchOrganizationProfile هلق بترمي (throw) عند الفشل بدل ما ترجع
  // {success,data} — راجع services/organization.js. isError صار مصدر
  // الحقيقة المباشر لفشل التحميل بدل فحص success يدويًا
  const status = data?.status ?? null;
  // ⚠️ كانت ناقصة قبل — الـ Banner بيدعم عرض السبب أصلًا، بس 4 من 5
  // صفحات بتستخدم هالـ hook ما كانت توصلها لأنها ما كانت موجودة هون
  const rejectionReason = data?.rejectionReason ?? null;

  // ⚠️ مهم: status=null بيصير بحالتين مختلفتين تمامًا:
  // 1) الطلب نجح لكن ما في organization/status (نادر) → مفيش خطأ فعلي
  // 2) الطلب فشل فعليًا (isError) → لازم نعرف هاد الفرق وإلا الواجهة
  // بتصمت تمامًا وكأنه "ما في داعي لأي Banner"، بينما الحقيقة إنه فشل
  // تحميل الحالة ولازم يظهر خطأ واضح للمستخدم
  const hasLoadError = isError;

  // كائن المنظمة الكامل (description, city...) — مطلوب لتذكير اكتمال
  // البروفايل (isOrganizationProfileComplete) بدون أي طلب شبكة إضافي،
  // لأنه أصلًا محمّل ومخزّن بكاش useOrganizationProfileQuery
  const organization = data ?? null;

  return {
    status,
    rejectionReason,
    organization,
    loading: isLoading,
    hasLoadError,
    isVerified: status === ORGANIZATION_STATUS.VERIFIED,
    meta: getOrganizationStatusMeta(status),
  };
}