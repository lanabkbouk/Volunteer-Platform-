// components/common/ClickableAvatar.jsx
//
// يلف أي صورة/Avatar بزر "تكبير عند النقر" (نفس فكرة "Open larger
// preview" الموجودة بـ AdminOrganizationDetailsModal، بس معمَّمة كمكوّن
// واحد بدل تكرار نفس useState + Modal بكل مكان بيعرض صورة).
//
// children هو المحتوى المعروض حاليًا (Avatar.jsx، ImageUploader، أو أي
// عنصر صورة/أيقونة بديلة) — يضل زي ما هو تمامًا، بس يصير قابل للنقر.

import { useState } from "react";
import Modal from "../ui/Modal";

export default function ClickableAvatar({ src, alt, children, className = "" }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // ⚠️ نفس حارس Avatar.jsx: رابط blob: مضمون إنه معطوب (مربوط بذاكرة
  // تبويب سابق)، فما في داعي نسمح بفتح Lightbox لصورة أكيد رح تفشل
  const hasValidSrc = Boolean(src) && !src.startsWith("blob:");

  if (!hasValidSrc) return children;

  return (
    <>
      {/* className اختياري: افتراضيًا الزر ياخد حجم محتواه فقط (مناسب
          لـAvatar بحجم ثابت h-14/w-14 مثلًا). لو الصورة الملفوفة بتعتمد
          على w-full/h-full من أبوها (مثل شعار منظمة بصندوق aspect ثابت)،
          لازم الاستدعاء يمرّر className="h-full w-full" وإلا الصورة
          بتفقد حجمها لأنه % بيتحسب نسبة لحجم الزر، مش الحاوية الأصلية */}
      <button
        type="button"
        onClick={() => setIsPreviewOpen(true)}
        className={`cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${className}`}
        aria-label={`View ${alt || "image"} larger`}
      >
        {children}
      </button>

      <Modal open={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} dialogClassName="max-w-xl">
        <img src={src} alt={alt} className="max-h-[80vh] w-full object-contain rounded-2xl" />
      </Modal>
    </>
  );
}
