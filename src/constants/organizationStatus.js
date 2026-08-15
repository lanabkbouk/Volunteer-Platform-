// حالات توثيق المنظمة الممكنة
export const ORGANIZATION_STATUS = {
  PENDING: "pending", // بانتظار المراجعة والتوثيق
  VERIFIED: "verified", // موثّقة ومفعّلة بالكامل
  REJECTED: "rejected", // تم رفض طلب التوثيق
  SUSPENDED: "suspended", // موقوفة مؤقتًا من قبل الإدارة
};

/**
 * بيانات وصفية (Meta) موحّدة لكل حالة، تُستخدم في كل مكونات البروفايل
 * (Badge بالـ Header، Badge بالـ Preview، و Banner بأعلى الصفحة)
 * بدون تكرار النصوص أو الألوان في أكثر من مكان.
 *
 * label            -> النص القصير الظاهر بالـ Badge (مثال: "Pending")
 * message          -> شرح أطول يظهر بالـ Banner فقط
 * badgeClassName   -> ألوان الـ Badge الصغير (Header / Preview)
 * bannerClassName  -> ألوان الـ Banner الكامل (VerificationStatusBanner)
 */
export const ORGANIZATION_STATUS_META = {
  [ORGANIZATION_STATUS.PENDING]: {
    label: "Pending Review",
    message: "Your organization is awaiting verification by our team. This may take a few days.",
    badgeClassName: "bg-amber-100 text-amber-800",
    bannerClassName: "bg-amber-50 border-amber-200 text-amber-800",
  },
  [ORGANIZATION_STATUS.VERIFIED]: {
    label: "Verified",
    message: "Your organization has been verified and can post volunteer opportunities.",
    badgeClassName: "bg-success/10 text-success",
    bannerClassName: "bg-success/5 border-success/20 text-success",
  },
  [ORGANIZATION_STATUS.REJECTED]: {
    label: "Rejected",
    message: "Your verification request was rejected. Please review the reason below and update your information.",
    badgeClassName: "bg-danger/10 text-danger",
    bannerClassName: "bg-danger/5 border-danger/20 text-danger",
  },
  [ORGANIZATION_STATUS.SUSPENDED]: {
    label: "Suspended",
    message: "Your organization account has been suspended by the platform administrators.",
    badgeClassName: "bg-gray-200 text-gray-700",
    bannerClassName: "bg-gray-50 border-gray-200 text-gray-700",
  },
};

/**
 * دالة مساعدة لجلب البيانات الوصفية لحالة معينة بأمان
 * تُعيد بيانات حالة "Pending" كقيمة افتراضية إذا كانت الحالة غير معروفة
 * @param {string} status - إحدى قيم ORGANIZATION_STATUS
 * @returns {{label: string, message: string, badgeClassName: string, bannerClassName: string}}
 */
export const getOrganizationStatusMeta = (status) =>
  ORGANIZATION_STATUS_META[status] ?? ORGANIZATION_STATUS_META[ORGANIZATION_STATUS.PENDING];

export default ORGANIZATION_STATUS;