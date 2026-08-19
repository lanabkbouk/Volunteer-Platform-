import { useState } from 'react'
import { KeyRound, MailCheck } from 'lucide-react'

import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Typography from '../ui/Typography'

// واجهة "إعادة تعيين كلمة المرور" — محاكاة لتدفّق "نسيت كلمة المرور"
// الذاتي (إيميل فيه رابط إعادة تعيين)، منفصلة عن "تغيير كلمة المرور"
// بصفحة البروفايل (اللي بتتطلّب معرفة كلمة المرور الحالية). واجهة فقط،
// بدون أي استدعاء فعلي لإيميل أو Endpoint حقيقي حاليًا.
export default function AdminResetPasswordModal({ open, onClose, email }) {
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  // تصفير الحالة المحلية لحظة إعادة الفتح — معدّل أثناء الـ render نفسه
  // (بدل useEffect) حتى ما يصير "cascading render" إضافي بدون داعي؛
  // نفس النمط الموصى فيه رسميًا من React لإعادة ضبط حالة عند تغيّر prop
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setIsSending(false)
      setIsSent(false)
    }
  }

  const handleSendResetLink = () => {
    setIsSending(true)

    // TODO: ربط هذا الإجراء بـ endpoint حقيقي لطلب إعادة تعيين كلمة المرور
    // (Laravel) لما يجهز — هذا التدفّق واجهة فقط/محاكى حاليًا، بدون أي
    // إرسال إيميل فعلي
    setTimeout(() => {
      setIsSending(false)
      setIsSent(true)
    }, 700)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reset password"
      footer={
        isSent ? (
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendResetLink}
              isLoading={isSending}
              loadingText="Sending..."
            >
              Send reset link
            </Button>
          </>
        )
      }
    >
      {isSent ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
            <MailCheck size={22} aria-hidden="true" />
          </div>
          <Typography variant="bodySm" className="text-body">
            If an account exists for <span className="font-medium text-heading">{email}</span>, a reset link has
            been sent.
          </Typography>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              <KeyRound size={20} aria-hidden="true" />
            </div>
            <Typography variant="bodySm" className="text-body">
              We'll send a password reset link to the email address on this admin account. Use it to set a new
              password from a fresh browser session.
            </Typography>
          </div>

          <div className="rounded-2xl border border-heading/10 bg-heading/5 px-4 py-3">
            <Typography variant="overline" className="text-body/70">
              Reset link will be sent to
            </Typography>
            <Typography variant="body" className="mt-1 font-medium">
              {email || 'No email on file'}
            </Typography>
          </div>
        </div>
      )}
    </Modal>
  )
}
