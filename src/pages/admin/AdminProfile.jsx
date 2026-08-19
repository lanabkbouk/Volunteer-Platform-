import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserRound } from 'lucide-react'

import AdminLayout from '../../layouts/admin/AdminLayout'
import Badge from '../../components/common/Badge'
import Button from '../../components/ui/Button'
import InfoRow from '../../components/ui/InfoRow'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Toast from '../../components/common/Toast'
import Typography from '../../components/ui/Typography'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import { useUpdateAdminProfileMutation } from '../../hooks/queries/useUpdateAdminProfileMutation'
import { useChangeAdminPasswordMutation } from '../../hooks/queries/useChangeAdminPasswordMutation'
import { ROUTES } from '../../constants/paths'
import { ADMIN_CARD_BASE, ADMIN_PANEL_SURFACE, ADMIN_GHOST_BUTTON } from '../../utils/adminStyles'
import { formatDateTime } from '../../utils/formatDateTime'

const EMPTY_PROFILE = {
  name: '',
  email: '',
  phone: '',
  bio: '',
}

function ProfileEditModal({ open, profile, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState(EMPTY_PROFILE)
  // تعبئة الفورم بأحدث بيانات البروفايل لحظة الفتح — معدّلة أثناء الـ
  // render نفسه (بدل useEffect) لتفادي "cascading render" إضافي بدون داعي
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setForm(profile || EMPTY_PROFILE)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit profile"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSubmit(form)} isLoading={isSubmitting} loadingText="Saving...">
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Full name"
          name="admin-name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Full name"
        />
        <Input
          label="Email"
          name="admin-email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="name@example.com"
        />
        <Input
          label="Phone number"
          name="admin-phone"
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          placeholder="+1 555 000 000"
        />
        <Textarea
          label="Short bio"
          name="admin-bio"
          rows={4}
          value={form.bio}
          onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
          placeholder="Optional short bio for the admin account"
        />
      </div>
    </Modal>
  )
}

function PasswordModal({ open, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change password"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => onSubmit(form)} isLoading={isSubmitting} loadingText="Updating...">
            Update password
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Typography variant="bodySm" className="text-body">
          Use a strong password and keep it unique to the admin account.
        </Typography>

        <Input
          label="Current password"
          name="current-password"
          type="password"
          value={form.currentPassword}
          onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
          placeholder="Current password"
        />
        <Input
          label="New password"
          name="new-password"
          type="password"
          value={form.newPassword}
          onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
          placeholder="New password"
        />
        <Input
          label="Confirm password"
          name="confirm-password"
          type="password"
          value={form.confirmPassword}
          onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
          placeholder="Confirm new password"
        />
      </div>
    </Modal>
  )
}

export default function AdminProfile() {
  const { user, updateUser } = useAuth()
  const { toast, showSuccess, showError, closeToast } = useToast()
  const updateProfileMutation = useUpdateAdminProfileMutation()
  const changePasswordMutation = useChangeAdminPasswordMutation()

  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const profile = useMemo(
    () => ({
      name: user?.displayName || user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || user?.about || '',
    }),
    [user],
  )

  const accountStatus = user?.status || 'Active'
  const createdAt = formatDateTime(user?.createdAt || user?.created_at)
  const lastLogin = formatDateTime(user?.lastLoginAt || user?.last_login_at || user?.lastLogin)

  const handleSubmitProfile = async (form) => {
    const result = await updateProfileMutation.mutateAsync({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      bio: form.bio.trim(),
    })

    if (!result.success) {
      showError(result.error || 'Unable to update profile right now.')
      return
    }

    // مزامنة الجلسة المحلية (AuthContext) مع القيم المحفوظة فعليًا —
    // نفس النمط المتّبع بصفحات بروفايل المنظمة/المتطوع
    updateUser({ ...user, ...form })
    showSuccess('Profile updated successfully.')
    setEditOpen(false)
  }

  const handleSubmitPassword = async (form) => {
    if (!form.newPassword || form.newPassword !== form.confirmPassword) {
      showError('New password and confirmation must match.')
      return
    }

    const result = await changePasswordMutation.mutateAsync({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })

    if (!result.success) {
      showError(result.error || 'Unable to update password right now.')
      return
    }

    showSuccess('Password updated successfully.')
    setPasswordOpen(false)
  }

  return (
    <AdminLayout
      eyebrow="Administrative workspace"
      title="Profile"
      description="Account-only profile information for the system administrator. Volunteer-specific data is intentionally excluded."
      actions={
        <>
          <Button as={Link} to={ROUTES.ADMIN_SETTINGS} variant="ghost" className={ADMIN_GHOST_BUTTON}>
            Settings
          </Button>
          <Button as={Link} to={ROUTES.ADMIN_DASHBOARD} variant="primary">
            Back to dashboard
          </Button>
        </>
      }
    >
      <section className={`${ADMIN_PANEL_SURFACE} p-6 md:p-8`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-adminAccent/15 text-adminAccentSoft">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.displayName || 'Admin profile'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound size={28} aria-hidden="true" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Typography variant="h3" className="text-adminTextHi!">{profile.name || 'System administrator'}</Typography>
                <Badge label="System admin" tone="secondary" dark />
              </div>
              <Typography variant="bodySm" className="mt-1 text-adminTextLo!">
                {profile.email || 'No email provided'}
              </Typography>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(true)} className={ADMIN_GHOST_BUTTON}>
              Edit profile
            </Button>
            <Button variant="primary" onClick={() => setPasswordOpen(true)}>
              Change password
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section className={`${ADMIN_CARD_BASE} p-5 md:p-6`}>
          <Typography variant="h4" className="text-adminTextHi!">Account information</Typography>
          <div className="mt-4 space-y-1.5">
            <InfoRow dark label="Full name" value={profile.name || '—'} />
            <InfoRow dark label="Email" value={profile.email || '—'} />
            <InfoRow dark label="Phone number" value={profile.phone || '—'} />
            <InfoRow dark label="Short bio" value={profile.bio || '—'} />
            <InfoRow dark label="Role" value="System administrator" />
            <InfoRow dark label="Account status" value={accountStatus} />
            <InfoRow dark label="Created at" value={createdAt} />
            <InfoRow dark label="Last login" value={lastLogin} />
          </div>
        </section>

        <section className={`${ADMIN_CARD_BASE} p-5 md:p-6`}>
          <Typography variant="h4" className="text-adminTextHi!">Account notes</Typography>
          <div className="mt-4 space-y-3 text-sm text-adminTextLo">
            <p>
              The admin profile intentionally keeps account data separate from volunteer and organization
              details.
            </p>
            <p>
              Use the profile editor to update contact details and the password dialog to rotate access
              credentials when needed.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge label="Account only" tone="neutral" dark />
              <Badge label="No volunteer fields" tone="success" dark />
            </div>
          </div>
        </section>
      </div>

      <ProfileEditModal
        open={editOpen}
        profile={profile}
        onClose={() => setEditOpen(false)}
        onSubmit={handleSubmitProfile}
        isSubmitting={updateProfileMutation.isPending}
      />

      <PasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSubmit={handleSubmitPassword}
        isSubmitting={changePasswordMutation.isPending}
      />

      <Toast message={toast.message} variant={toast.variant} duration={7000} onClose={closeToast} />
    </AdminLayout>
  )
}