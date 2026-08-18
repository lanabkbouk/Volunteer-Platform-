// components/common/Avatar.jsx
//
// نقطة واحدة لعرض "صورة رمزية" (صورة فعلية أو حرف أول كبديل) — بدل ما
// كل Component (ApplicantCard، VolunteerProfilePreviewModal، ...) يكرر
// نفس شرط "لو فيه صورة اعرضها، وإلا اعرض الحرف الأول" بطريقته الخاصة.
// كانت ApplicantCard تتجاهل volunteer.photo تمامًا (تعرض الحرف دايمًا)
// بينما VolunteerProfilePreviewModal تتحقق منه فعليًا — نفس الشخص كان
// يظهر بشكلين مختلفين حسب مكان العرض. هالمكوّن هو مصدر الحقيقة الوحيد.

import { useState } from "react";

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

  const [prevSrc, setPrevSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(hasValidSrc);

  // ⚠️ لازم نصفّر حالتي الفشل/التحميل لما src نفسه يتغيّر (مثلًا صورة
  // جديدة بعد رفع)، وإلا رابط قديم فشل تحميله بيخلي الأفاتار عالق على
  // الفولباك حتى لو الرابط الجديد سليم 100%. تحديث الحالة أثناء الـ
  // render (مش جوا useEffect) هو النمط الموصى فيه من React لـ"تصفير
  // حالة لما prop يتغيّر" — بيتفادى إعادة render إضافية بعد الـ commit
  if (src !== prevSrc) {
    setPrevSrc(src);
    setHasError(false);
    setIsLoading(hasValidSrc);
  }

  if (!hasValidSrc || hasError) {
    return (
      <div
        className={`${sizeClasses} rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 ${className}`}
        aria-hidden="true"
      >
        {name?.charAt(0)?.toUpperCase() || "?"}
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses} shrink-0 ${className}`}>
      {/* Skeleton دائري بسيط لحد ما الصورة تخلص تحميل — يمنع "ومضة" مكان
          فاضي أو قفزة تخطيط لما الصورة توصل لاحقًا (شبكة بطيئة) */}
      {isLoading && (
        <div
          className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={name || "Profile"}
        className={`h-full w-full rounded-full object-cover transition-opacity duration-200 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
    </div>
  );
}