// components/common/Avatar.jsx
//
// نقطة واحدة لعرض "صورة رمزية" (صورة فعلية أو حرف أول كبديل) — بدل ما
// كل Component (ApplicantCard، VolunteerProfilePreviewModal، ...) يكرر
// نفس شرط "لو فيه صورة اعرضها، وإلا اعرض الحرف الأول" بطريقته الخاصة.
// كانت ApplicantCard تتجاهل volunteer.photo تمامًا (تعرض الحرف دايمًا)
// بينما VolunteerProfilePreviewModal تتحقق منه فعليًا — نفس الشخص كان
// يظهر بشكلين مختلفين حسب مكان العرض. هالمكوّن هو مصدر الحقيقة الوحيد.

const SIZE_CLASSES = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-14 w-14 text-lg",
};

export default function Avatar({ src, name, size = "md", className = "" }) {
  const sizeClasses = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  // ⚠️ راجع services/api/fileToDataUrl.js — أي رابط blob: هون مضمون
  // إنه معطوب (مربوط بذاكرة تبويب سابق)، فما في داعي حتى نحاول نعرضه
  // كصورة <img> ونستنى فشل التحميل؛ نتعامل معه كـ"ما في صورة" فورًا
  const hasValidSrc = Boolean(src) && !src.startsWith("blob:");

  if (hasValidSrc) {
    return (
      <img
        src={src}
        alt={name || "Profile"}
        className={`${sizeClasses} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 ${className}`}
      aria-hidden="true"
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}