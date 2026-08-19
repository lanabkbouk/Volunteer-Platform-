// green/blue/purple/red مربوطين بتوكنات الألوان الدلالية المركزية
// (success/info/achievement/danger بـ index.css) بدل درجات Tailwind خام
// — أي تعديل مستقبلي على هالألوان بيصير بمكان واحد وينعكس هون تلقائيًا
const COLOR_STYLES = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  gold: "bg-amber-100 text-amber-800 border-amber-200",
  silver: "bg-slate-200 text-slate-700 border-slate-300",
  bronze: "bg-orange-100 text-orange-800 border-orange-200",
  blue: "bg-info/10 text-info border-info/20",
  purple: "bg-achievement/10 text-achievement border-achievement/20",
  green: "bg-success/10 text-success border-success/20",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
  red: "bg-danger/10 text-danger border-danger/20",
  gray: "bg-gray-100 text-gray-600 border-gray-200",
};

// نسخة Dark من نفس التوليفات — خلفية شفافة غامقة + حدّ رفيع بنفس اللون
// + نص ساطع، بدل الباستيل الفاتح أعلاه المصمَّم لخلفية بيضاء. نفس
// الصبغة اللونية الأساسية لكل لون (أحمر يبقى أحمر...)، تُستخدم داخل
// لوحة الأدمن الغامقة فقط عبر prop الـ dark
const DARK_COLOR_STYLES = {
  primary: "bg-primary/10 text-primary border-primary/25",
  secondary: "bg-adminAccent/15 text-adminAccentSoft border-adminAccent/30",
  gold: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  silver: "bg-slate-400/10 text-slate-300 border-slate-400/25",
  bronze: "bg-orange-500/10 text-orange-400 border-orange-500/25",
  blue: "bg-info/10 text-info border-info/25",
  purple: "bg-achievement/10 text-achievement border-achievement/25",
  green: "bg-success/10 text-success border-success/25",
  pink: "bg-pink-500/10 text-pink-400 border-pink-500/25",
  red: "bg-danger/10 text-danger border-danger/25",
  gray: "bg-gray-400/10 text-gray-300 border-gray-400/25",
};

export default function Chip({ children, color = "primary", dark = false, className = "", customStyle = "" }) {
  const palette = dark ? DARK_COLOR_STYLES : COLOR_STYLES;
  const styles = customStyle || palette[color] || palette.primary;

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm border font-medium shadow-sm ${styles} ${className}`}
    >
      {children}
    </span>
  );
}