import Typography from "./Typography";

// dark=true لعرض InfoRow فوق خلفية لوحة الأدمن الغامقة — color="muted"/
// "heading" الافتراضيان (heading الغامق) شبه غير مرئيين فوقها، فنمرّر
// className صريح (adminTextLo/adminTextHi) يطغى عليهما بدلًا منهم. لازم
// !important (!text-admin...) لأن Typography.jsx بيخبّئ لون الـ color prop
// كـ class ثابت (text-heading/60، text-heading)، وTailwind بيفرز
// التعارضات (نفس الخاصية) حسب ترتيب توليدها الداخلي مش ترتيب className
// بالـ JSX — بدون ! كان اللون الافتراضي الغامق يفوز أحيانًا فوق الغامق
// (تأكّد بمراجعة بصرية حية لنفس المشكلة بـ Typography داخل الأدمن)
export default function InfoRow({ label, value, dark = false }) {
  return (
    <div className="flex justify-between items-center py-1 gap-3">
      <Typography
        variant="bodySm"
        color="muted"
        className={`whitespace-nowrap shrink-0 ${dark ? "text-adminTextLo!" : ""}`}
      >
        {label}
      </Typography>

      <Typography
        variant="bodySm"
        color="heading"
        weight="medium"
        className={`min-w-0 flex-1 truncate text-left ${dark ? "text-adminTextHi!" : ""}`}
      >
        {value || "—"}
      </Typography>
    </div>
  );
}
