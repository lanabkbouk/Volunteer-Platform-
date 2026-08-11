import { Info } from 'lucide-react'
import { useCountUp } from '../../hooks/useCountUp'
import { CARD_SURFACE, CARD_ELEVATION } from '../../utils/surfaceStyles'

/**
 * @param {string} [hint] - تلميح توضيحي اختياري (Tooltip عبر title) —
 * يظهر فقط لو انمرر، بدون أي أثر على الاستخدامات الحالية بـ Home/About
 * التي لا تمرّره إطلاقًا
 * @param {Function} [icon] - أيقونة Lucide اختيارية تُعرض كشارة أعلى
 * الرقم — بدون أي أثر على الاستخدامات الحالية التي لا تمرّرها (Home,
 * About, Dashboard)، فبتضل بنفس شكلها القديم تمامًا
 */
export default function StatCard({ number, label, suffix = '+', hint, icon: Icon }) {
  const { displayValue, elementRef } = useCountUp(number)

  return (
    <div
      ref={elementRef}
      className={`${CARD_SURFACE} ${CARD_ELEVATION} p-8 text-center relative`}
    >
      {hint && (
        <span
          title={hint}
          className="absolute top-3 right-3 text-heading/30 hover:text-heading/60 cursor-help"
          aria-label={hint}
        >
          <Info size={15} aria-hidden="true" />
        </span>
      )}

      {Icon && (
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Icon size={20} className="text-primary" aria-hidden="true" />
        </div>
      )}

      <div className="text-4xl font-bold text-primary mb-3">
        {displayValue}{suffix}
      </div>

      <p className="text-heading/70 text-sm font-medium leading-relaxed">
        {label}
      </p>
    </div>
  )
}