// إشعار عابر (Toast) عام يظهر أعلى الشاشة، قابل لإعادة الاستخدام لأي حدث
// لحظي (توثيق منظمة، نجاح عملية، خطأ عام...) وليس فقط لحالة التوثيق.
// يُغلق تلقائيًا بعد `duration`، أو يدويًا بزر الإغلاق.
//
// نرندره عبر createPortal على document.body لنفس سبب Modal.jsx: الصفحات
// ملفوفة بـ motion.div (framer-motion) بيطبّق transform، فيكسر تموضع
// position:fixed لو تركناه جوا شجرة الصفحة العادية.

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const VARIANT_STYLES = {
  success: { icon: CheckCircle2, className: 'bg-green-50 border-green-200 text-green-800' },
  error: { icon: XCircle, className: 'bg-red-50 border-red-200 text-red-800' },
  info: { icon: Info, className: 'bg-field border-heading/15 text-heading' },
}

// actionLabel/onAction اختياريان (نفس نمط EmptyState's actionLabel/onAction)
// — لما ينمرروا سوا، بيظهر زر نصي إضافي جوا التوست (مثلًا "Undo") قبل
// زر الإغلاق X. بدونهم، التوست بيشتغل بالضبط متل ما كان (رسالة + إغلاق فقط)
export default function Toast({ message, variant = 'info', duration = 6000, onClose, actionLabel, onAction }) {
  // إغلاق تلقائي بعد مدة معيّنة، طالما في رسالة معروضة فعليًا
  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  const { icon: Icon, className } = VARIANT_STYLES[variant] ?? VARIANT_STYLES.info
  const hasAction = Boolean(actionLabel && onAction)

  const handleAction = () => {
    onAction()
    onClose()
  }

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0"
    >
      <div className={`flex items-start gap-3 rounded-2xl border p-4 shadow-lg ${className}`}>
        <Icon size={20} className="mt-0.5 shrink-0" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        {hasAction && (
          <button
            type="button"
            onClick={handleAction}
            className="shrink-0 text-sm font-semibold underline decoration-2 underline-offset-2 opacity-90 transition-opacity hover:opacity-100"
          >
            {actionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
        >
          <X size={16} />
        </button>
      </div>
    </div>,
    document.body,
  )
}