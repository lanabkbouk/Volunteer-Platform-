
// اللبنة الأساسية لـ Skeleton Loading بكل المشروع: صندوق رمادي نابض
// بهدوء بمكان المحتوى الحقيقي لحد ما توصل البيانات — بدل نص "Loading..."
// أو Spinner بمنتصف الشاشة يعمل قفزة بصرية (Layout Shift) لما تجهز
// البيانات. بيتحدّد شكله بالكامل عبر className (عرض/ارتفاع/استدارة)
// حسب مكان استخدامه، فما في داعي لعدة نسخ منه.
//
// الحركة (النبض) بتتعطّل تلقائيًا إذا المستخدم مفعّل "تقليل الحركة"
// (راجع .animate-pulse بملف index.css).

export default function Skeleton({ className = "", dark = false }) {
  // bg-heading/10 (تينت غامق خفيف) شبه غير مرئي فوق خلفية الأدمن الغامقة
  // نفسها — dark=true يستخدم تينت أبيض خفيف بدلها بنفس المنطق
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`animate-pulse rounded-xl ${dark ? "bg-white/8" : "bg-heading/10"} ${className}`}
    />
  );
}