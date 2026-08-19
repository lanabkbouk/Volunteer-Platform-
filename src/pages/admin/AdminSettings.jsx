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
import { ADMIN_CARD_SURFACE, ADMIN_PANEL_SURFACE, ADMIN_GHOST_BUTTON, ADMIN_CHECKBOX } from '../../utils/adminStyles'
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
        <section className={`${ADMIN_PANEL_SURFACE} p-6 md:p-8`}>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-adminAccent/15 p-3 text-adminAccentSoft">
              <BellRing size={20} aria-hidden="true" />
            </div>
            <div>
              <Typography variant="h4" className="text-adminTextHi!">Notification preferences</Typography>
              <Typography variant="bodySm" className="mt-1 text-adminTextLo!">
                Choose the admin notifications that matter for your workflow.
              </Typography>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className={`${ADMIN_CARD_SURFACE} flex cursor-pointer items-center justify-between gap-4 p-4 transition-colors hover:bg-white/6`}>
              <div>
                <Typography variant="h6" className="text-adminTextHi!">Verification emails</Typography>
                <Typography variant="bodySm" className="mt-1 text-adminTextLo!">
                  Receive a notice when a verification decision is submitted.
                </Typography>
              </div>
              <input
                type="checkbox"
                checked={preferences.verificationEmails}
                onChange={togglePreference('verificationEmails')}
                className={ADMIN_CHECKBOX}
              />
            </label>

            <label className={`${ADMIN_CARD_SURFACE} flex cursor-pointer items-center justify-between gap-4 p-4 transition-colors hover:bg-white/6`}>
              <div>
                <Typography variant="h6" className="text-adminTextHi!">Weekly digest</Typography>
                <Typography variant="bodySm" className="mt-1 text-adminTextLo!">
                  Get a compact summary of platform activity once per week.
                </Typography>
              </div>
              <input
                type="checkbox"
                checked={preferences.weeklyDigest}
                onChange={togglePreference('weeklyDigest')}
                className={ADMIN_CHECKBOX}
              />
            </label>

            <label className={`${ADMIN_CARD_SURFACE} flex cursor-pointer items-center justify-between gap-4 p-4 transition-colors hover:bg-white/6`}>
              <div>
                <Typography variant="h6" className="text-adminTextHi!">Security alerts</Typography>
                <Typography variant="bodySm" className="mt-1 text-adminTextLo!">
                  Notify on new sign-ins and unusual account activity.
                </Typography>
              </div>
              <input
                type="checkbox"
                checked={preferences.securityAlerts}
                onChange={togglePreference('securityAlerts')}
                className={ADMIN_CHECKBOX}
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={handleSave}>
              Save preferences
            </Button>
          </div>
        </section>

        <section className={`${ADMIN_PANEL_SURFACE} p-6 md:p-8`}>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-success/10 p-3 text-success">
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            <div>
              <Typography variant="h4" className="text-adminTextHi!">Security and shortcuts</Typography>
              <Typography variant="bodySm" className="mt-1 text-adminTextLo!">
                Keep the account state visible and move quickly between account screens.
              </Typography>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className={`${ADMIN_CARD_SURFACE} p-4`}>
              <Typography variant="overline" className="text-adminTextLo!">
                Last login
              </Typography>
              <Typography variant="h5" className="mt-2 text-adminTextHi!">
                {lastLogin}
              </Typography>
            </div>

            <div className={`${ADMIN_CARD_SURFACE} p-4`}>
              <Typography variant="overline" className="text-adminTextLo!">
                Account status
              </Typography>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge label={user?.status || 'Active'} tone="success" dark />
                <Badge label="System admin" tone="secondary" dark />
              </div>
            </div>

            <div className={`${ADMIN_CARD_SURFACE} p-4`}>
              <Typography variant="overline" className="text-adminTextLo!">
                Password
              </Typography>
              <Typography variant="bodySm" className="mt-2 text-adminTextLo!">
                Send a reset link to this account's email instead of changing the password directly from the
                profile page.
              </Typography>
              <div className="mt-3">
                <Button variant="ghost" onClick={() => setResetPasswordOpen(true)} className={ADMIN_GHOST_BUTTON}>
                  <KeyRound size={16} aria-hidden="true" />
                  <span className="ml-1.5">Reset password</span>
                </Button>
              </div>
            </div>

            <div className={`${ADMIN_CARD_SURFACE} p-4`}>
              <Typography variant="overline" className="text-adminTextLo!">
                Quick actions
              </Typography>

              <div className="mt-3 flex flex-wrap gap-3">
                <Button as={Link} to={ROUTES.ADMIN_PROFILE} variant="ghost" className={ADMIN_GHOST_BUTTON}>
                  Open profile
                </Button>
                <Button as={Link} to={ROUTES.ADMIN_DASHBOARD} variant="ghost" className={ADMIN_GHOST_BUTTON}>
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