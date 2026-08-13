const VARIANT_STYLES = {
  error: 'border-danger bg-danger/10 text-danger',
  success: 'border-success bg-success/10 text-success',
}

// بانر رسالة موحّد لصفحات المصادقة (Login/Register/ForgotPassword/ResetPassword)
// بدل تكرار نفس الـ <p> بكل صفحة على حدة
export default function AuthAlert({ variant = 'error', children }) {
  if (!children) return null

  return (
    <p role='alert' className={`rounded-lg border px-3 py-2 text-sm ${VARIANT_STYLES[variant]}`}>
      {children}
    </p>
  )
}
