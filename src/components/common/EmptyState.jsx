// components/common/EmptyState.jsx
//
// حالة فارغة موحّدة تُستخدم بكل الصفحات (بدل ما كل صفحة تبني حالتها
// الفارغة يدويًا لحالها). الشكل: أيقونة + عنوان + وصف + زر إجراء بارز
// (اختياري) — نفس النمط المتعارف عليه عالميًا بمعظم المواقع والتطبيقات
// (GitHub, Notion, Linear...) لتشجيع المستخدم يتخذ الخطوة التالية بدل
// ما يوقف عند "ما في شي هون".

import Button from "../ui/Button";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-20 px-6">
      
      {Icon && (
        <div className="relative flex items-center justify-center w-24 h-24">
          {/* illustration بسيطة (SVG محلي، بلونين primary/primary-10 بس):
              دائرة كبيرة كخلفية + نقطتين زخرفيتين، والأيقونة الفعلية
              (يلي بتفرق حسب السياق) فوقها بالمنتصف — الـIcon prop نفسه
              ما تغيّر، بس صار محاط بخلفية illustration بدل مربّع بسيط */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 96 96"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="48" cy="48" r="48" className="fill-primary/10" />
            <circle cx="80" cy="18" r="5" className="fill-primary/10" />
            <circle cx="14" cy="78" r="4" className="fill-primary/10" />
          </svg>

          <Icon size={30} className="relative text-primary" aria-hidden="true" />
        </div>
      )}

      <h3 className="font-semibold text-heading text-lg">{title}</h3>

      {description && (
        <p className="text-sm text-body max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button variant="primary" size="medium" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}