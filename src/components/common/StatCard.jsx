import { useState } from 'react'
import { Info } from 'lucide-react'
import { useCountUp } from '../../hooks/useCountUp'
import useClickOutside from '../../hooks/useClickOutside'
import { CARD_SURFACE, CARD_ELEVATION } from '../../utils/surfaceStyles'

/**
 * @param {string} [hint] - تلميح توضيحي اختياري — يظهر فقط لو انمرر،
 * بدون أي أثر على الاستخدامات الحالية بـ Home/About التي لا تمرّره إطلاقًا.
 * يظهر بالـ hover (desktop) أو الضغط (touch، ما إله hover إطلاقًا) —
 * نفس نمط StatusLegendPopover
 * @param {Function} [icon] - أيقونة Lucide اختيارية تُعرض كشارة أعلى
 * الرقم — بدون أي أثر على الاستخدامات الحالية التي لا تمرّرها (Home,
 * About, Dashboard)، فبتضل بنفس شكلها القديم تمامًا
 */
export default function StatCard({ number, label, suffix = '+', hint, icon: Icon }) {
  const { displayValue, elementRef } = useCountUp(number)
  const [isHintOpen, setIsHintOpen] = useState(false)
  const hintRef = useClickOutside(isHintOpen, () => setIsHintOpen(false))

  return (
    <div
      ref={elementRef}
      className={`${CARD_SURFACE} ${CARD_ELEVATION} p-5 sm:p-8 text-center relative`}
    >
      {hint && (
        <div ref={hintRef} className="absolute top-3 right-3">
          <button
            type="button"
            title={hint}
            onClick={() => setIsHintOpen((current) => !current)}
            className="text-heading/30 hover:text-heading/60 cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
            aria-label={hint}
            aria-expanded={isHintOpen}
          >
            <Info size={15} aria-hidden="true" />
          </button>

          {isHintOpen && (
            <div
              role="tooltip"
              className="absolute right-0 z-10 mt-2 w-56 rounded-xl bg-field border-2 border-heading/20 shadow-2xl p-3 text-left text-xs font-normal leading-snug text-body"
            >
              {hint}
            </div>
          )}
        </div>
      )}

      {Icon && (
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Icon size={20} className="text-primary" aria-hidden="true" />
        </div>
      )}

      <div className="text-3xl sm:text-4xl font-bold text-primary mb-3">
        {displayValue}{suffix}
      </div>

      <p className="text-heading/70 text-sm font-medium leading-relaxed">
        {label}
      </p>
    </div>
  )
}