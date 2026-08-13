// نافذة منبثقة عامة قابلة لإعادة الاستخدام (ما كانت موجودة إطلاقًا
// بالمشروع). تُغلق بـ Escape أو الضغط خارجها، وتاخد الفوكس تلقائيًا
// عند الفتح لدعم قارئات الشاشة والتنقّل بالكيبورد.
//
// ملاحظة مهمة: نرندرها عبر createPortal مباشرة جوا document.body.
// السبب: كل الصفحات ملفوفة بـ motion.div (framer-motion) بـ MainLayout،
// وFramer Motion بيطبّق CSS transform عليه — وأي transform على عنصر أب
// بيصير containing block جديد لأي عنصر جواه بـ position:fixed، فهيك
// الـ Modal كان بيتموضع نسبة لصفحة الـ motion.div (وينقص أو يطلع
// بمكان غلط) بدل الشاشة كاملة. الـ Portal بيطلع الـ Modal برّا هالشجرة
// تمامًا، فـ position:fixed بيرجع يشتغل نسبة للـ viewport متل ما لازم.

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Typography from "./Typography";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  dialogClassName = "max-w-md",
  // اختياري (Opt-in) — فقط للنوافذ يلي محتواها ممكن يتجاوز ارتفاع
  // الشاشة (مثل تفاصيل توثيق المنظمة). لما تكون false (الافتراضي)،
  // الشكل يضل تمامًا متل ما كان قبل — صفر تأثير على باقي المودالز
  // الصغيرة (إضافة تصنيف/مهارة/ساعات...) يلي ما بتحتاج أي تمرير
  scrollBody = false,
}) {
  const dialogRef = useRef(null);
  const generatedTitleId = useId();
  const titleId = title ? generatedTitleId : undefined;

  // مفصول لحاله عمدًا (deps: [open] بس): الهدف الوحيد هون هو نقل
  // الفوكس للنافذة أول ما تُفتح. لو كان جوا نفس الـ effect يلي فيه
  // onClose بالـ deps (متل ما كان قبل)، أي إعادة إنشاء لدالة onClose
  // (شائعة جدًا: أي مودال فيه state محلي — متل حقل نص — بيعيد بناء
  // onClose المُغلَّفة بكل keystroke) كانت تعيد تشغيل الـ effect وتسحب
  // الفوكس من الـ input/textarea رجوع لصندوق النافذة، فيصير المؤشر
  // "يقفز" برا الحقل بعد أول حرف — هيك الفوكس بينقل مرة وحدة بس فعليًا
  // لحظة الفتح، وما بينتقل تاني لحد ما open تتغيّر من جديد
  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    // Focus Trap: بدون هاد، Tab/Shift+Tab كانوا يقدروا "يهرّبوا" الفوكس
    // برا النافذة لعناصر الصفحة الخلفية وهي مفتوحة (خطر خصوصًا مع
    // الـ overlay المعتم يلي بيوهم إنه محتوى الصفحة مش قابل للتفاعل)
    function trapFocus(event) {
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }
      trapFocus(event);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div aria-hidden="true" className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`animate-shell-in relative w-full rounded-2xl border border-heading/10 bg-field shadow-2xl focus:outline-none ${
          scrollBody ? "flex max-h-[85vh] flex-col" : "p-6"
        } ${dialogClassName}`}
      >
        {scrollBody ? (
          <>
            {title && (
              <Typography id={titleId} variant="h4" className="shrink-0 px-6 pt-6">
                {title}
              </Typography>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 text-sm text-body leading-relaxed">
              {children}
            </div>

            {footer && (
              <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-heading/10 px-6 py-4">
                {footer}
              </div>
            )}
          </>
        ) : (
          <>
            {title && (
              <Typography id={titleId} variant="h4" gutterBottom>
                {title}
              </Typography>
            )}

            <div className="text-sm text-body leading-relaxed">{children}</div>

            {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}