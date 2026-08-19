import { useMemo, useState } from 'react'
import { Megaphone, Search } from 'lucide-react'

import AdminLayout from '../../layouts/admin/AdminLayout'
import AuthAlert from '../../components/auth/AuthAlert'
import EmptyState from '../../components/common/EmptyState'
import ShowMoreButton from '../../components/common/ShowMoreButton'
import Chip from '../../components/ui/Chip'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import Typography from '../../components/ui/Typography'
import Button from '../../components/ui/Button'
import { useShowMore } from '../../hooks/useShowMore'
import { useAdminOpportunitiesQuery } from '../../hooks/queries/useAdminOpportunitiesQuery'
import { OPPORTUNITY_STATUS_META } from '../../constants/opportunityStatus'
import { formatDateTime } from '../../utils/formatDateTime'
import { ADMIN_CARD_BASE, ADMIN_PANEL_SURFACE } from '../../utils/adminStyles'

function AdminOpportunitiesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={`${ADMIN_CARD_BASE} p-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Skeleton dark className="h-5 w-56" />
              <Skeleton dark className="h-4 w-48" />
              <Skeleton dark className="h-4 w-40" />
            </div>
            <div className="flex gap-2">
              <Skeleton dark className="h-8 w-28 rounded-full" />
              <Skeleton dark className="h-8 w-28 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// نسخة غامقة (dark) من OpportunityStatusBadge.jsx — نفس OPPORTUNITY_STATUS_META
// (لون/أيقونة/نص) بلا أي لون جديد، بس عبر Chip dark={true} حتى يتوافق
// مع توكنات الأدمن الغامقة (OpportunityStatusBadge نفسه ما بيعرّض
// خيار dark، وتعديله خارج نطاق هالمهمة)
function OpportunityStatusChip({ status }) {
  const meta = OPPORTUNITY_STATUS_META[status]
  if (!meta) return null

  const Icon = meta.icon

  return (
    <Chip color={meta.color} dark className="inline-flex items-center gap-1.5">
      {Icon && <Icon size={13} aria-hidden="true" />}
      {meta.label}
    </Chip>
  )
}

function OpportunityRow({ opportunity }) {
  return (
    <div className={`${ADMIN_CARD_BASE} p-5`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <Typography variant="h6" className="truncate text-adminTextHi!">
            {opportunity.title || 'Untitled opportunity'}
          </Typography>
          <Typography variant="bodySm" className="truncate text-adminTextLo!">
            {opportunity.organizationName || 'Unknown organization'}
          </Typography>
          <Typography variant="caption" className="text-adminTextLo!">
            {opportunity.city || 'City not specified'} · Created {formatDateTime(opportunity.createdAt)} · Starts{' '}
            {formatDateTime(opportunity.startDate)}
          </Typography>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <OpportunityStatusChip status={opportunity.status} />
        </div>
      </div>
    </div>
  )
}

export default function AdminOpportunities() {
  const { data: opportunitiesData, isPending, isError, error, refetch } = useAdminOpportunitiesQuery()
  const opportunities = useMemo(() => opportunitiesData ?? [], [opportunitiesData])

  const [searchTerm, setSearchTerm] = useState('')

  const filteredOpportunities = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return opportunities

    return opportunities.filter((opportunity) => {
      const haystack = [opportunity.title, opportunity.organizationName, opportunity.city]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [opportunities, searchTerm])

  const {
    visibleItems: visibleOpportunities,
    hasMore,
    remainingCount,
    showMore,
  } = useShowMore(filteredOpportunities)

  return (
    <AdminLayout
      eyebrow="Administrative workspace"
      title="Opportunities"
      description="A read-only view of every opportunity published on the platform."
    >
      <section className={`${ADMIN_PANEL_SURFACE} p-5 md:p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Typography variant="h4" className="text-adminTextHi!">All opportunities</Typography>
            <Typography variant="bodySm" className="mt-1 text-adminTextLo!">
              Search by opportunity title, organization, or city.
            </Typography>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-adminTextLo">
            <span>
              All <span className="font-semibold tabular-nums text-adminTextHi">{opportunities.length}</span>
            </span>
          </div>
        </div>

        <div className="mt-5 max-w-xl">
          <Input
            name="opportunitySearch"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search opportunities"
            icon={Search}
            aria-label="Search opportunities"
          />
        </div>
      </section>

      {isPending ? (
        <AdminOpportunitiesSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-start gap-3">
          <AuthAlert variant="error">{error?.message || 'Failed to load opportunities'}</AuthAlert>
          <Button variant="danger" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={searchTerm ? 'No matching opportunities' : 'No opportunities available'}
          description={
            searchTerm
              ? 'Try a different keyword or clear the search.'
              : 'Opportunities will appear here once organizations publish them.'
          }
          dark
        />
      ) : (
        <>
          <div className="space-y-3">
            {visibleOpportunities.map((opportunity) => (
              <OpportunityRow key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
          {hasMore && <ShowMoreButton remainingCount={remainingCount} onClick={showMore} />}
        </>
      )}
    </AdminLayout>
  )
}
