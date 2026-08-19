import { Link } from 'react-router-dom'
import {
  Building2,
  LayoutDashboard,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Tags,
  Users,
} from 'lucide-react'

import AdminLayout from '../../layouts/admin/AdminLayout'
import AdminStatCard from '../../components/admin/AdminStatCard'
import AuthAlert from '../../components/auth/AuthAlert'
import Badge from '../../components/common/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/common/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import Typography from '../../components/ui/Typography'
import { usePlatformStatsQuery } from '../../hooks/queries/usePlatformStatsQuery'
import { useCategoriesQuery } from '../../hooks/queries/useCategoriesQuery'
import { useAdminOrganizationsQuery } from '../../hooks/queries/useAdminOrganizationsQuery'
import { ORGANIZATION_STATUS } from '../../constants/organizationStatus'
import { ROUTES } from '../../constants/paths'
import { ADMIN_CARD_BASE, ADMIN_CARD_SURFACE, ADMIN_PANEL_SURFACE, ADMIN_GHOST_BUTTON } from '../../utils/adminStyles'
import { formatDateTime } from '../../utils/formatDateTime'

function getStatusTone(status) {
  if (status === ORGANIZATION_STATUS.VERIFIED) return 'success'
  if (status === ORGANIZATION_STATUS.REJECTED) return 'danger'
  return 'warning'
}

function getStatusLabel(status) {
  if (status === ORGANIZATION_STATUS.VERIFIED) return 'Verified'
  if (status === ORGANIZATION_STATUS.REJECTED) return 'Rejected'
  return 'Pending'
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={`${ADMIN_CARD_BASE} p-5 md:p-6`}>
            <Skeleton dark className="h-4 w-28" />
            <Skeleton dark className="mt-4 h-10 w-20" />
            <Skeleton dark className="mt-4 h-4 w-40" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`${ADMIN_PANEL_SURFACE} lg:col-span-2 p-6 md:p-8`}>
          <Skeleton dark className="h-6 w-56" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-adminBorder p-4">
                <Skeleton dark className="h-5 w-48" />
                <Skeleton dark className="mt-3 h-4 w-56" />
              </div>
            ))}
          </div>
        </div>

        <div className={`${ADMIN_PANEL_SURFACE} p-6 md:p-8`}>
          <Skeleton dark className="h-6 w-40" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton dark key={index} className="h-12 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const platformStatsQuery = usePlatformStatsQuery()
  const categoriesQuery = useCategoriesQuery()
  const organizationsQuery = useAdminOrganizationsQuery()

  const stats = platformStatsQuery.data?.success ? platformStatsQuery.data.data : null
  const categories = categoriesQuery.data ?? []
  const organizations = organizationsQuery.data ?? []

  const volunteersCount = stats?.volunteersCount ?? 0
  const totalOrganizations = stats?.organizationsCount ?? organizations.length
  const totalOpportunities = stats?.opportunitiesCount ?? 0
  const totalCategories = categories.length
  const pendingVerifications = organizations.filter(
    (organization) => organization.status === ORGANIZATION_STATUS.PENDING,
  ).length
  const verifiedOrganizations = organizations.filter(
    (organization) => organization.status === ORGANIZATION_STATUS.VERIFIED,
  ).length
  const rejectedOrganizations = organizations.filter(
    (organization) => organization.status === ORGANIZATION_STATUS.REJECTED,
  ).length

  const loading =
    platformStatsQuery.isPending || categoriesQuery.isPending || organizationsQuery.isPending

  const errorMessage =
    (platformStatsQuery.isFetched && !platformStatsQuery.data?.success
      ? platformStatsQuery.data?.error || 'Unable to load platform stats'
      : '') ||
    categoriesQuery.error?.message ||
    organizationsQuery.error?.message ||
    ''

  const recentOrganizations = [...organizations]
    .sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0))
    .slice(0, 5)

  // مقاييس إضافية للوحة "Platform monitoring" غير مكررة عن بطاقات
  // الإحصاءات بالأعلى — مشتقة من نفس بيانات organizations المحمّلة أصلًا
  // بدون أي نداء API إضافي
  const verificationRate =
    totalOrganizations > 0 ? Math.round((verifiedOrganizations / totalOrganizations) * 100) : 0

  const oldestPendingOrganization = organizations
    .filter((organization) => organization.status === ORGANIZATION_STATUS.PENDING)
    .sort((a, b) => new Date(a.requestedAt || 0) - new Date(b.requestedAt || 0))[0]

  const newestOrganization = recentOrganizations[0]

  return (
    <AdminLayout
      eyebrow="Administrative workspace"
      title="Dashboard"
      description="A focused overview of platform health, verification progress, and catalog maintenance."
      actions={
        <div className="flex flex-wrap gap-3">
          <Button as={Link} to={ROUTES.ADMIN_ORGANIZATIONS} variant="primary">
            Review organizations
          </Button>
          <Button as={Link} to={ROUTES.ADMIN_CATEGORIES} variant="ghost" className={ADMIN_GHOST_BUTTON}>
            Manage categories
          </Button>
        </div>
      }
    >
      {errorMessage && (
        <div className="flex flex-col items-start gap-3">
          <AuthAlert variant="error">{errorMessage}</AuthAlert>
          <Button
            variant="danger"
            size="small"
            onClick={() => {
              platformStatsQuery.refetch()
              categoriesQuery.refetch()
              organizationsQuery.refetch()
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <AdminDashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AdminStatCard
              label="Total volunteers"
              value={volunteersCount}
              description="Registered volunteer accounts on the platform."
              icon={Users}
              accent="secondary"
            />
            <AdminStatCard
              label="Total organizations"
              value={totalOrganizations}
              description="All organizations currently registered."
              icon={Building2}
              accent="secondary"
            />
            <AdminStatCard
              label="Pending verification"
              value={pendingVerifications}
              description="Organizations waiting for a decision."
              icon={ShieldAlert}
              accent="warning"
            />
            <AdminStatCard
              label="Verified organizations"
              value={verifiedOrganizations}
              description="Organizations cleared to use the platform."
              icon={ShieldCheck}
              accent="success"
            />
            <AdminStatCard
              label="Total categories"
              value={totalCategories}
              description="Professional categories available across the platform."
              icon={Tags}
              accent="neutral"
            />
            <AdminStatCard
              label="Total opportunities"
              value={totalOpportunities}
              description="Published volunteering opportunities."
              icon={Megaphone}
              accent="secondary"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            <section className={`${ADMIN_PANEL_SURFACE} lg:col-span-2 p-6 md:p-8`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Typography variant="h4" className="text-adminTextHi!">Verification queue</Typography>
                  <Typography variant="bodySm" className="mt-1 text-adminTextLo!">
                    Keep verified and rejected organizations visible while you review status changes.
                  </Typography>
                </div>

                <Badge label={`${pendingVerifications} pending`} tone="warning" dark />
              </div>

              <div className="mt-6 space-y-3">
                {recentOrganizations.length === 0 ? (
                  <EmptyState
                    icon={LayoutDashboard}
                    title="No organizations yet"
                    description="New organizations will appear here once they register."
                    dark
                  />
                ) : (
                  recentOrganizations.map((organization) => (
                    <div
                      key={organization.id}
                      className={`${ADMIN_CARD_SURFACE} px-4 py-3`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <Typography variant="h6" className="truncate text-adminTextHi!">
                            {organization.name || 'Untitled organization'}
                          </Typography>
                          <Typography variant="bodySm" className="mt-1 truncate text-adminTextLo!">
                            {organization.email || 'No email provided'}
                          </Typography>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge label={getStatusLabel(organization.status)} tone={getStatusTone(organization.status)} dark />
                          <span className="text-xs text-adminTextLo">
                            {formatDateTime(organization.requestedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={`${ADMIN_PANEL_SURFACE} p-6 md:p-8`}>
              <Typography variant="h4" className="text-adminTextHi!">Platform monitoring</Typography>
              <Typography variant="bodySm" className="mt-1 text-adminTextLo!">
                A quick health snapshot for the admin workspace.
              </Typography>

              <div className="mt-6 space-y-3">
                {/* المقاييس هون مقصودة تكون مختلفة عن بطاقات الإحصاءات
                    بالأعلى (raw totals)، مش تكرارًا لها — راجع تعليق
                    verificationRate/oldestPendingOrganization/newestOrganization أعلاه */}
                <div className={`${ADMIN_CARD_SURFACE} px-4 py-3`}>
                  <Typography variant="overline" className="text-adminTextLo!">
                    Verification rate
                  </Typography>
                  <Typography variant="h5" className="mt-1 text-adminTextHi!">
                    {verificationRate}%
                  </Typography>
                </div>

                <div className={`${ADMIN_CARD_SURFACE} px-4 py-3`}>
                  <Typography variant="overline" className="text-adminTextLo!">
                    Rejected organizations
                  </Typography>
                  <Typography variant="h5" className="mt-1 text-adminTextHi!">
                    {rejectedOrganizations}
                  </Typography>
                </div>

                <div className={`${ADMIN_CARD_SURFACE} px-4 py-3`}>
                  <Typography variant="overline" className="text-adminTextLo!">
                    Newest organization
                  </Typography>
                  <Typography variant="h5" className="mt-1 truncate text-adminTextHi!">
                    {newestOrganization?.name || 'No organizations yet'}
                  </Typography>
                </div>

                <div className={`${ADMIN_CARD_SURFACE} px-4 py-3`}>
                  <Typography variant="overline" className="text-adminTextLo!">
                    Oldest pending request
                  </Typography>
                  <Typography variant="h5" className="mt-1 text-adminTextHi!">
                    {oldestPendingOrganization ? formatDateTime(oldestPendingOrganization.requestedAt) : 'None pending'}
                  </Typography>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Button as={Link} to={ROUTES.ADMIN_ORGANIZATIONS} variant="primary" fullWidth>
                  Open review queue
                </Button>
                <Button as={Link} to={ROUTES.ADMIN_PROFILE} variant="ghost" fullWidth className={ADMIN_GHOST_BUTTON}>
                  Review account details
                </Button>
              </div>
            </section>
          </div>
        </>
      )}
    </AdminLayout>
  )
}