import { useMemo, useState } from 'react'
import { useShowMore } from '../../hooks/useShowMore'
import { Search, ShieldCheck } from 'lucide-react'

import AdminLayout from '../../layouts/admin/AdminLayout'
import OrganizationReviewCard from '../../components/admin/OrganizationReviewCard'
import AdminOrganizationDetailsModal from '../../components/admin/AdminOrganizationDetailsModal'
import VerificationDecisionModal from '../../components/admin/VerificationDecisionModal'
import AuthAlert from '../../components/auth/AuthAlert'
import ConfirmModal from '../../components/common/ConfirmModal'
import EmptyState from '../../components/common/EmptyState'
import ShowMoreButton from '../../components/common/ShowMoreButton'
import Toast from '../../components/common/Toast'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import Typography from '../../components/ui/Typography'
import Button from '../../components/ui/Button'
import { useAdminOrganizationsQuery } from '../../hooks/queries/useAdminOrganizationsQuery'
import { useReviewOrganizationMutation } from '../../hooks/queries/useReviewOrganizationMutation'
import { useToast } from '../../hooks/useToast'
import { ORGANIZATION_STATUS } from '../../constants/organizationStatus'
import { ROUTES } from '../../constants/paths'
import { ADMIN_CARD_BASE, ADMIN_PANEL_SURFACE, ADMIN_GHOST_BUTTON } from '../../utils/adminStyles'

function AdminOrganizationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={`${ADMIN_CARD_BASE} p-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Skeleton dark className="h-6 w-56" />
              <Skeleton dark className="h-4 w-72" />
              <Skeleton dark className="h-4 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton dark className="h-10 w-28 rounded-xl" />
              <Skeleton dark className="h-10 w-28 rounded-xl" />
              <Skeleton dark className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminOrganizationsReview() {
  const { data: organizationsData, isPending, isError, error, refetch } = useAdminOrganizationsQuery()
  // ⚠️ مو `data: organizations = []` (قيمة افتراضية بالتفكيك) — هاي
  // بترجع مصفوفة `[]` *جديدة كل Render* طالما data لسا undefined، ما
  // بتضل بنفس المرجع، وبتكسر useShowMore (كانت تسبب "Too many
  // re-renders" هون بالضبط قبل هالإصلاح)
  const organizations = useMemo(() => organizationsData ?? [], [organizationsData])
  const reviewMutation = useReviewOrganizationMutation()
  const { toast, showSuccess, showError, closeToast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrganization, setSelectedOrganization] = useState(null)
  const [organizationToApprove, setOrganizationToApprove] = useState(null)
  const [organizationToReject, setOrganizationToReject] = useState(null)
  const [organizationToSuspend, setOrganizationToSuspend] = useState(null)

  const filteredOrganizations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return organizations

    return organizations.filter((organization) => {
      const haystack = [
        organization.name,
        organization.email,
        organization.phone,
        organization.city,
        organization.contactPerson,
        organization.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [organizations, searchTerm])

  const {
    visibleItems: visibleOrganizations,
    hasMore,
    remainingCount,
    showMore,
  } = useShowMore(filteredOrganizations)

  const totals = {
    all: organizations.length,
    pending: organizations.filter((organization) => organization.status === ORGANIZATION_STATUS.PENDING).length,
    approved: organizations.filter((organization) => organization.status === ORGANIZATION_STATUS.VERIFIED).length,
    rejected: organizations.filter((organization) => organization.status === ORGANIZATION_STATUS.REJECTED).length,
    suspended: organizations.filter((organization) => organization.status === ORGANIZATION_STATUS.SUSPENDED).length,
  }

  const updatingId = reviewMutation.isPending ? reviewMutation.variables?.organizationId : null

  const SUCCESS_MESSAGES = {
    [ORGANIZATION_STATUS.VERIFIED]: 'Organization approved.',
    [ORGANIZATION_STATUS.REJECTED]: 'Organization rejected.',
    [ORGANIZATION_STATUS.SUSPENDED]: 'Organization suspended.',
  }

  const submitDecision = async ({ organizationId, status, reason }) => {
    const result = await reviewMutation.mutateAsync({ organizationId, status, reason })

    if (!result.success) {
      showError(result.error || 'Failed to submit this decision')
      return false
    }

    showSuccess(SUCCESS_MESSAGES[status] || 'Decision submitted.')
    setSelectedOrganization(null)
    return true
  }

  const handleApprove = (organization) => {
    setSelectedOrganization(null)
    setOrganizationToApprove(organization)
  }

  const handleReject = (organization) => {
    setSelectedOrganization(null)
    setOrganizationToReject(organization)
  }

  const handleSuspend = (organization) => {
    setSelectedOrganization(null)
    setOrganizationToSuspend(organization)
  }

  const handleConfirmApproval = async () => {
    if (!organizationToApprove) return

    const success = await submitDecision({
      organizationId: organizationToApprove.id,
      status: ORGANIZATION_STATUS.VERIFIED,
    })

    if (success) setOrganizationToApprove(null)
  }

  const handleConfirmRejection = async (reason) => {
    if (!organizationToReject) return

    const success = await submitDecision({
      organizationId: organizationToReject.id,
      status: ORGANIZATION_STATUS.REJECTED,
      reason,
    })

    if (success) setOrganizationToReject(null)
  }

  const handleConfirmSuspension = async (reason) => {
    if (!organizationToSuspend) return

    const success = await submitDecision({
      organizationId: organizationToSuspend.id,
      status: ORGANIZATION_STATUS.SUSPENDED,
      reason,
    })

    if (success) setOrganizationToSuspend(null)
  }

  return (
    <AdminLayout
      eyebrow="Administrative workspace"
      title="Organization verification"
      description="Review every organization, keep approved and rejected items visible, and use the status badges to track the queue at a glance."
      actions={
        <>
          <Button variant="ghost" as="a" href={ROUTES.ADMIN_DASHBOARD} className={ADMIN_GHOST_BUTTON}>
            Dashboard
          </Button>
          <Button variant="ghost" as="a" href={ROUTES.ADMIN_CATEGORIES} className={ADMIN_GHOST_BUTTON}>
            Categories
          </Button>
        </>
      }
    >
      <section className={`${ADMIN_PANEL_SURFACE} p-5 md:p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Typography variant="h4" className="text-adminTextHi!">Review queue</Typography>
            <Typography variant="bodySm" className="mt-1 text-adminTextLo!">
              Search by organization name, email, phone, city, or current status.
            </Typography>
          </div>

          {/* أرقام إجمالية بس للاستئناس البصري — عرضها كنص/عداد عادي (بدون
              حدود/pill/hover) بدل Badge، حتى ما توهم الأدمن بإنها فلاتر
              قابلة للنقر بينما هي مجرد أرقام إعلامية بجانب مربع البحث */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-adminTextLo">
            <span>
              All <span className="font-semibold tabular-nums text-adminTextHi">{totals.all}</span>
            </span>
            <span>
              Pending <span className="font-semibold tabular-nums text-adminTextHi">{totals.pending}</span>
            </span>
            <span>
              Approved <span className="font-semibold tabular-nums text-adminTextHi">{totals.approved}</span>
            </span>
            <span>
              Rejected <span className="font-semibold tabular-nums text-adminTextHi">{totals.rejected}</span>
            </span>
            <span>
              Suspended <span className="font-semibold tabular-nums text-adminTextHi">{totals.suspended}</span>
            </span>
          </div>
        </div>

        <div className="mt-5 max-w-xl">
          <Input
            name="organizationSearch"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search organizations"
            icon={Search}
            aria-label="Search organizations"
          />
        </div>
      </section>

      {isPending ? (
        <AdminOrganizationsSkeleton />
      ) : isError ? (
        // هاي أهم صفحة عمل بلوحة الأدمن (قائمة التحقق) — فشل الجلب لازم
        // يظهر كخطأ صريح مع إعادة محاولة، مش كقائمة فاضية تُفهم غلط
        // كـ"لا يوجد منظمات مسجّلة"
        <div className="flex flex-col items-start gap-3">
          <AuthAlert variant="error">{error?.message || 'Failed to load organizations'}</AuthAlert>
          <Button variant="danger" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : filteredOrganizations.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={searchTerm ? 'No matching organizations' : 'No organizations available'}
          description={
            searchTerm
              ? 'Try a different keyword or clear the search.'
              : 'Organizations will appear here once they register.'
          }
          dark
        />
      ) : (
        <>
          <div className="space-y-3">
            {visibleOrganizations.map((organization) => (
              <OrganizationReviewCard
                key={organization.id}
                organization={organization}
                isUpdating={updatingId === organization.id}
                onViewDetails={setSelectedOrganization}
                onApprove={handleApprove}
                onReject={handleReject}
                onSuspend={handleSuspend}
              />
            ))}
          </div>
          {hasMore && <ShowMoreButton remainingCount={remainingCount} onClick={showMore} />}
        </>
      )}

      <AdminOrganizationDetailsModal
        open={Boolean(selectedOrganization)}
        organization={selectedOrganization}
        onClose={() => setSelectedOrganization(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        isSubmitting={reviewMutation.isPending}
      />

      <VerificationDecisionModal
        open={Boolean(organizationToReject)}
        organizationName={organizationToReject?.name}
        mode="reject"
        onClose={() => setOrganizationToReject(null)}
        onConfirm={handleConfirmRejection}
        isSubmitting={reviewMutation.isPending}
      />

      <VerificationDecisionModal
        open={Boolean(organizationToSuspend)}
        organizationName={organizationToSuspend?.name}
        mode="suspend"
        onClose={() => setOrganizationToSuspend(null)}
        onConfirm={handleConfirmSuspension}
        isSubmitting={reviewMutation.isPending}
      />

      <ConfirmModal
        open={Boolean(organizationToApprove)}
        onClose={() => setOrganizationToApprove(null)}
        onConfirm={handleConfirmApproval}
        title={
          organizationToApprove?.status === ORGANIZATION_STATUS.SUSPENDED
            ? `Reinstate ${organizationToApprove?.name || 'organization'}?`
            : `Approve ${organizationToApprove?.name || 'organization'}?`
        }
        description={
          organizationToApprove?.status === ORGANIZATION_STATUS.SUSPENDED
            ? "This will lift the suspension immediately. The organization will be able to publish and manage opportunities again, and its status will update in the review list and the organization profile."
            : 'This will mark the organization as approved immediately. The status will update in the review list and the organization profile.'
        }
        confirmLabel={organizationToApprove?.status === ORGANIZATION_STATUS.SUSPENDED ? 'Confirm reinstatement' : 'Confirm approval'}
        confirmVariant="success"
        isLoading={reviewMutation.isPending}
        loadingText={organizationToApprove?.status === ORGANIZATION_STATUS.SUSPENDED ? 'Reinstating...' : 'Approving...'}
      />

      <Toast message={toast.message} variant={toast.variant} duration={7000} onClose={closeToast} />
    </AdminLayout>
  )
}