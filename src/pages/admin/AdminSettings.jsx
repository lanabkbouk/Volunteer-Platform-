import { Link } from 'react-router-dom'
import { BellRing, KeyRound, ShieldCheck } from 'lucide-react'

import AdminLayout from '../../layouts/admin/AdminLayout'
import AdminResetPasswordModal from '../../components/admin/AdminResetPasswordModal'
import Badge from '../../components/common/Badge'
import Button from '../../components/ui/Button'
import Typography from '../../components/ui/Typography'
import Toast from '../../components/common/Toast'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import { ROUTES } from '../../constants/paths'
import { CARD_SURFACE, CARD_ELEVATION, PANEL_SURFACE } from '../../utils/surfaceStyles'
import { formatDateTime } from '../../utils/formatDateTime'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'admin-settings-preferences'

function loadPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { verificationEmails: true, weeklyDigest: true, securityAlerts: true }

    const parsed = JSON.parse(raw)
    return {
      verificationEmails: Boolean(parsed.verificationEmails),
      weeklyDigest: Boolean(parsed.weeklyDigest),
      securityAlerts: Boolean(parsed.securityAlerts),
    }
  } catch {
    return { verificationEmails: true, weeklyDigest: true, securityAlerts: true }
  }
}

export default function AdminSettings() {
  const { user } = useAuth()
  const { toast, showSuccess, closeToast } = useToast()
  const [preferences, setPreferences] = useState(loadPreferences)
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)

  // TODO: هذه التفضيلات محفوظة محليًا فقط (localStorage) حاليًا — لما يجهز
  // endpoint حقيقي لتفضيلات إشعارات الأدمن بالباك اند (Laravel)، تُستبدل
  // القراءة/الكتابة هون باستدعاء الخدمة المناسب بدل localStorage مباشرة
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  const lastLogin = formatDateTime(user?.lastLoginAt || user?.last_login_at || user?.lastLogin)

  const handleSave = () => {
    showSuccess('Settings saved locally.')
  }

  const togglePreference = (key) => (event) => {
    setPreferences((current) => ({ ...current, [key]: event.target.checked }))
  }

  return (
    <AdminLayout
      eyebrow="Administrative workspace"
      title="Settings"
      description="Keep admin notifications and account preferences tidy without adding unnecessary complexity."
      actions={
        <Button as={Link} to={ROUTES.ADMIN_PROFILE} variant="primary">
          Open profile
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section className={`${PANEL_SURFACE} p-6 md:p-8`}>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <BellRing size={20} aria-hidden="true" />
            </div>
            <div>
              <Typography variant="h4">Notification preferences</Typography>
              <Typography variant="bodySm" className="mt-1 text-body">
                Choose the admin notifications that matter for your workflow.
              </Typography>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className={`${CARD_SURFACE} ${CARD_ELEVATION} flex items-center justify-between gap-4 p-4`}>
              <div>
                <Typography variant="h6">Verification emails</Typography>
                <Typography variant="bodySm" className="mt-1 text-body">
                  Receive a notice when a verification decision is submitted.
                </Typography>
              </div>
              <input
                type="checkbox"
                checked={preferences.verificationEmails}
                onChange={togglePreference('verificationEmails')}
                className="h-5 w-5 rounded border-heading/20 text-primary focus:ring-primary/30"
              />
            </label>

            <label className={`${CARD_SURFACE} ${CARD_ELEVATION} flex items-center justify-between gap-4 p-4`}>
              <div>
                <Typography variant="h6">Weekly digest</Typography>
                <Typography variant="bodySm" className="mt-1 text-body">
                  Get a compact summary of platform activity once per week.
                </Typography>
              </div>
              <input
                type="checkbox"
                checked={preferences.weeklyDigest}
                onChange={togglePreference('weeklyDigest')}
                className="h-5 w-5 rounded border-heading/20 text-primary focus:ring-primary/30"
              />
            </label>

            <label className={`${CARD_SURFACE} ${CARD_ELEVATION} flex items-center justify-between gap-4 p-4`}>
              <div>
                <Typography variant="h6">Security alerts</Typography>
                <Typography variant="bodySm" className="mt-1 text-body">
                  Notify on new sign-ins and unusual account activity.
                </Typography>
              </div>
              <input
                type="checkbox"
                checked={preferences.securityAlerts}
                onChange={togglePreference('securityAlerts')}
                className="h-5 w-5 rounded border-heading/20 text-primary focus:ring-primary/30"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={handleSave}>
              Save preferences
            </Button>
          </div>
        </section>

        <section className={`${PANEL_SURFACE} p-6 md:p-8`}>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-700">
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            <div>
              <Typography variant="h4">Security and shortcuts</Typography>
              <Typography variant="bodySm" className="mt-1 text-body">
                Keep the account state visible and move quickly between account screens.
              </Typography>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className={`${CARD_SURFACE} ${CARD_ELEVATION} p-4`}>
              <Typography variant="overline" className="text-body/70">
                Last login
              </Typography>
              <Typography variant="h5" className="mt-2">
                {lastLogin}
              </Typography>
            </div>

            <div className={`${CARD_SURFACE} ${CARD_ELEVATION} p-4`}>
              <Typography variant="overline" className="text-body/70">
                Account status
              </Typography>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge label={user?.status || 'Active'} tone="success" />
                <Badge label="System admin" tone="primary" />
              </div>
            </div>

            <div className={`${CARD_SURFACE} ${CARD_ELEVATION} p-4`}>
              <Typography variant="overline" className="text-body/70">
                Password
              </Typography>
              <Typography variant="bodySm" className="mt-2 text-body">
                Send a reset link to this account's email instead of changing the password directly from the
                profile page.
              </Typography>
              <div className="mt-3">
                <Button variant="ghost" onClick={() => setResetPasswordOpen(true)}>
                  <KeyRound size={16} aria-hidden="true" />
                  <span className="ml-1.5">Reset password</span>
                </Button>
              </div>
            </div>

            <div className={`${CARD_SURFACE} ${CARD_ELEVATION} p-4`}>
              <Typography variant="overline" className="text-body/70">
                Quick actions
              </Typography>

              <div className="mt-3 flex flex-wrap gap-3">
                <Button as={Link} to={ROUTES.ADMIN_PROFILE} variant="ghost">
                  Open profile
                </Button>
                <Button as={Link} to={ROUTES.ADMIN_DASHBOARD} variant="ghost">
                  Open dashboard
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <AdminResetPasswordModal
        open={resetPasswordOpen}
        onClose={() => setResetPasswordOpen(false)}
        email={user?.email}
      />

      <Toast message={toast.message} variant={toast.variant} duration={7000} onClose={closeToast} />
    </AdminLayout>
  )
}