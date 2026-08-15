// components/common/Badge.jsx
//
// شارة حالة بسيطة، نظيفة، ومتناسقة بصريًا مع بقية التصميم.

const TONE_CLASSES = {
  neutral: "bg-heading/5 text-body border-heading/10",
  primary: "bg-primary/10 text-primary border-primary/30",
  success: "bg-success/10 text-success border-success/30",
  secondary: "bg-secondary/10 text-secondary border-secondary/30",
  warning: "bg-amber-500/10 text-amber-700 border-amber-500/40",
  danger: "bg-danger/10 text-danger border-danger/40",
  header: "bg-field text-heading border-heading/10"
}

/**
 * @param {string} label
 * @param {'neutral'|'primary'|'secondary'|'warning'|'danger'} [tone='neutral']
 * @param {Function} [icon] - أيقونة Lucide اختيارية تُعرض قبل النص
 */
export default function Badge({ label, tone = "neutral", icon: Icon, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${TONE_CLASSES[tone]} shadow-sm ${className}`}
    >
      {Icon && <Icon size={14} aria-hidden="true" />}
      {label}
    </span>
  )
}