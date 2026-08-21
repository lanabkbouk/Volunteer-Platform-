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
import { useAdminVolunteersQuery } from '../../hooks/queries/useAdminVolunteersQuery'
import { useAdminOpportunitiesQuery } from '../../hooks/queries/useAdminOpportunitiesQuery'
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

// يقارن بالتاريخ فقط (منتصف الليل)، بدون الوقت الدقيق — نفس منطق
// toDateOnly بـ utils/opportunityValidation.js بالضبط
function toDateOnly(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

// عدد العناصر التي createdAt خلال آخر days يوم — تُستخدم لبطاقة
// "This week" بالأسفل، محسوبة بالكامل هون بالفرونت من بيانات محمّلة
// أصلًا (بلا أي endpoint إضافي)
function countCreatedSince(items, days) {
  const today = toDateOnly(new Date())
  const cutoff = toDateOnly(new Date())
  cutoff.setDate(cutoff.getDate() - days)

  return items.filter((item) => {
    if (!item.createdAt) return false
    const createdDate = toDateOnly(item.createdAt)
    return createdDate >= cutoff && createdDate <= today
  }).length
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={`${ADMIN_CARD_BASE} p-4 sm:p-5 md:p-6`}>
            <Skeleton dark className="h-4 w-20 sm:w-28" />
            <Skeleton dark className="mt-3 sm:mt-4 h-8 sm:h-10 w-16 sm:w-20" />
            <Skeleton dark className="mt-3 sm:mt-4 h-4 w-28 sm:w-40" />
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
  const volunteersQuery = useAdminVolunteersQuery()
  const opportunitiesQuery = useAdminOpportunitiesQuery()

  const stats = platformStatsQuery.data?.success ? platformStatsQuery.data.data : null
  const categories = categoriesQuery.data ?? []
  const organizations = organizationsQuery.data ?? []
  const volunteers = volunteersQuery.data ?? []
  const opportunities = opportunitiesQuery.data ?? []

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
    platformStatsQuery.isPending ||
    categoriesQuery.isPending ||
    organizationsQuery.isPending ||
    volunteersQuery.isPending ||
    opportunitiesQuery.isPending

  const errorMessage =
    (platformStatsQuery.isFetched && !platformStatsQuery.data?.success
      ? platformStatsQuery.data?.error || 'Unable to load platform stats'
      : '') ||
    categoriesQuery.error?.message ||
    organizationsQuery.error?.message ||
    volunteersQuery.error?.message ||
    opportunitiesQuery.error?.message ||
    ''

  // بطاقة "This week" — محسوبة بالكامل هون وقت فتح الصفحة من بيانات
  // المتطوعين/الفرص/المنظمات المحمّلة أصلًا، بلا أي endpoint إضافي. مش
  // تقرير مجدول حقيقي من الباك اند، فدقتها مرتبطة بلحظة التحميل فقط —
  // لو انضاف متطوع جديد بعد فتح الصفحة، الرقم ما بيتحدّث إلا بإعادة تحميل
  const newVolunteersThisWeek = countCreatedSince(volunteers, 7)
  const newOpportunitiesThisWeek = countCreatedSince(opportunities, 7)
  // organizations بتخزّن تاريخ التسجيل بحقل requestedAt (راجع
  // toOrganizationSummary بـ services/admin.js) مش createdAt، فنمرّرها
  // بنفس شكل {createdAt} المتوقّع من countCreatedSince بدل تعديل توقيعها
  const newOrganizationsThisWeek = countCreatedSince(
    organizations.map((organization) => ({ createdAt: organization.requestedAt })),
    7,
  )

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
              volunteersQuery.refetch()
              opportunitiesQuery.refetch()
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
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

          <section className={`${ADMIN_PANEL_SURFACE} p-6 md:p-8`}>
            <Typography variant="h4" className="text-adminTextHi!">This week</Typography>
            <Typography variant="bodySm" className="mt-1 text-adminTextLo!">
              New signups and listings over the last 7 days.
            </Typography>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className={`${ADMIN_CARD_SURFACE} px-4 py-3`}>
                <Typography variant="overline" className="text-adminTextLo!">
                  New volunteers
                </Typography>
                <Typography variant="h5" className="mt-1 text-adminTextHi!">
                  {newVolunteersThisWeek}
                </Typography>
              </div>

              <div className={`${ADMIN_CARD_SURFACE} px-4 py-3`}>
                <Typography variant="overline" className="text-adminTextLo!">
                  New organizations
                </Typography>
                <Typography variant="h5" className="mt-1 text-adminTextHi!">
                  {newOrganizationsThisWeek}
                </Typography>
              </div>

              <div className={`${ADMIN_CARD_SURFACE} px-4 py-3`}>
                <Typography variant="overline" className="text-adminTextLo!">
                  New opportunities
                </Typography>
                <Typography variant="h5" className="mt-1 text-adminTextHi!">
                  {newOpportunitiesThisWeek}
                </Typography>
              </div>
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  )
}