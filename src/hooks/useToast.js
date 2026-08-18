import { useCallback, useState } from 'react'

/**
 * نقطة إدارة الحالة الموحّدة لأي Toast بصفحة واحدة — بدل ما كل صفحة تعرّف
 * useState منفصل لكل من (submitError, successMessage) وتكرّر نفس منطق
 * الفتح/الإغلاق. صفحة واحدة = Toast واحد نشط بأي لحظة، فمعرّف نوع
 * الرسالة (variant) بدل حقلين منفصلين كافي وأبسط.
 *
 * @param {{message?: string, variant?: 'success'|'error'|'info'}} [initial]
 */
export function useToast(initial = { message: '', variant: 'info' }) {
  const [toast, setToast] = useState(initial)

  // options اختياري: { actionLabel, onAction } — لأي توست عنده فعل إضافي
  // قابل للضغط (مثلًا "Undo") جنب رسالته، بدون ما يأثر على استدعاءات
  // showToast/showSuccess/showError الحالية يلي ما بتمرره أصلًا
  const showToast = useCallback((message, variant = 'info', options = {}) => {
    setToast({ message, variant, actionLabel: options.actionLabel, onAction: options.onAction })
  }, [])

  const showSuccess = useCallback((message) => showToast(message, 'success'), [showToast])
  const showError = useCallback((message) => showToast(message, 'error'), [showToast])

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, message: '', actionLabel: undefined, onAction: undefined }))
  }, [])

  return { toast, showToast, showSuccess, showError, closeToast }
}