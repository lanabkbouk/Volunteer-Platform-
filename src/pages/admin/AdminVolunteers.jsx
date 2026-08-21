import { useMemo, useState } from 'react'
import { Megaphone, Search, Sparkles, Users } from 'lucide-react'

import AdminLayout from '../../layouts/admin/AdminLayout'
import AuthAlert from '../../components/auth/AuthAlert'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import ShowMoreButton from '../../components/common/ShowMoreButton'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import Typography from '../../components/ui/Typography'
import Button from '../../components/ui/Button'
import VolunteerProfilePreviewModal from '../../components/organization/VolunteerProfilePreviewModal'
import { useShowMore } from '../../hooks/useShowMore'
import { useAdminVolunteersQuery } from '../../hooks/queries/useAdminVolunteersQuery'
import { formatDateTime } from '../../utils/formatDateTime'
import { ADMIN_CARD_BASE, ADMIN_PANEL_SURFACE } from '../../utils/adminStyles'

function AdminVolunteersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={`${ADMIN_CARD_BASE} p-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Skeleton dark className="h-5 w-48" />
              <Skeleton dark className="h-4 w-56" />
              <Skeleton dark className="h-4 w-40" />
            </div>
            <div className="flex gap-2">
              <Skeleton dark className="h-8 w-24 rounded-full" />
              <Skeleton dark className="h-8 w-36 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function VolunteerRow({ volunteer, onSelect }) {
  const hasSkillsCount = typeof volunteer.skillsCount === 'number'
  const hasOpportunitiesJoinedCount = typeof volunteer.opportunitiesJoinedCount === 'number'

  return (
    // role="button" + onKeyDown بدل <button> حقيقي يلف الكارد بالكامل —
    // نفس نمط الـ Trigger بـ NavbarDropdown.jsx (role/tabIndex/Enter+Space)،
    // حتى نتجنب تعقيد لف Badge/أزرار داخلية بعنصر button (semantics متداخلة
    // غير صالحة بـ HTML: button جوا button)
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(volunteer)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(volunteer)
        }
      }}
      aria-label={`View profile for ${volunteer.name || 'volunteer'}`}
      className={`${ADMIN_CARD_BASE} p-5 cursor-pointer transition-colors hover:bg-white/6 focus:outline-none focus-visible:ring-2 focus-visible:ring-adminAccent/40`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <Typography variant="h6" className="truncate text-adminTextHi!">
            {volunteer.name || 'Unnamed volunteer'}
          </Typography>
          <Typography variant="bodySm" className="truncate text-adminTextLo!">
            {volunteer.email || 'No email provided'}
          </Typography>
          <Typography variant="caption" className="text-adminTextLo!">
            {volunteer.city || 'City not specified'} · Joined {formatDateTime(volunteer.createdAt)}
          </Typography>
        </div>

        {(hasSkillsCount || hasOpportunitiesJoinedCount) && (
          <div className="flex flex-wrap items-center gap-2">
            {hasSkillsCount && <Badge label={`${volunteer.skillsCount} skills`} tone="neutral" dark />}
            {hasOpportunitiesJoinedCount && (
              <Badge label={`${volunteer.opportunitiesJoinedCount} opportunities joined`} tone="secondary" dark />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminVolunteers() {
  const { data: volunteersData, isPending, isError, error, refetch } = useAdminVolunteersQuery()
  // نفس تحفّظ AdminOrganizationsReview.jsx بالضبط: `data ?? []` تُرجع
  // مرجعًا جديدًا كل Render أثناء التحميل، وتكسر useShowMore لو مررناها
  // مباشرة بدون useMemo
  const volunteers = useMemo(() => volunteersData ?? [], [volunteersData])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVolunteer, setSelectedVolunteer] = useState(null)

  const filteredVolunteers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return volunteers

    return volunteers.filter((volunteer) => {
      const haystack = [volunteer.name, volunteer.email].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(normalizedSearch)
    })
  }, [volunteers, searchTerm])

  const {
    visibleItems: visibleVolunteers,
    hasMore,
    remainingCount,
    showMore,
  } = useShowMore(filteredVolunteers)

  return (
    <AdminLayout
      eyebrow="Administrative workspace"
      title="Volunteers"
      description="A read-only view of every volunteer registered on the platform."
    >
      <section className={`${ADMIN_PANEL_SURFACE} p-5 md:p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Typography variant="h4" className="text-adminTextHi!">All volunteers</Typography>
            <Typography variant="bodySm" className="mt-1 text-adminTextLo!">
              Search by volunteer name or email.
            </Typography>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-adminTextLo">
            <span>
              All <span className="font-semibold tabular-nums text-adminTextHi">{volunteers.length}</span>
            </span>
          </div>
        </div>

        <div className="mt-5 max-w-xl">
          <Input
            name="volunteerSearch"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search volunteers"
            icon={Search}
            aria-label="Search volunteers"
          />
        </div>
      </section>

      {isPending ? (
        <AdminVolunteersSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-start gap-3">
          <AuthAlert variant="error">{error?.message || 'Failed to load volunteers'}</AuthAlert>
          <Button variant="danger" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : filteredVolunteers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchTerm ? 'No matching volunteers' : 'No volunteers available'}
          description={
            searchTerm
              ? 'Try a different keyword or clear the search.'
              : 'Volunteers will appear here once they register.'
          }
          dark
        />
      ) : (
        <>
          <div className="space-y-3">
            {visibleVolunteers.map((volunteer) => (
              <VolunteerRow key={volunteer.id} volunteer={volunteer} onSelect={setSelectedVolunteer} />
            ))}
          </div>
          {hasMore && <ShowMoreButton remainingCount={remainingCount} onClick={showMore} />}
        </>
      )}

      {/* بيانات المتطوع بلوحة الأدمن (useAdminVolunteersQuery) عدّادات
          بس — skillsCount/opportunitiesJoinedCount منصّة-wide فعليًا
          (مش مربوطة بمنظمة وحدة زي سياق ApplicantCard)، بدون ساعات أو
          إنجازات مفصّلة أصلًا بهالـ endpoint. فبدل ما نعرض "0 hours"/
          "0 achievements" مضلِّلة بافتراضيات المودال الأصلية (مصمّمة
          لسياق المنظمة)، منمرر stats الحقيقية المتوفرة فقط — راجع
          VolunteerProfilePreviewModal.jsx لتفاصيل الـ prop */}
      <VolunteerProfilePreviewModal
        open={Boolean(selectedVolunteer)}
        volunteer={selectedVolunteer}
        onClose={() => setSelectedVolunteer(null)}
        stats={
          selectedVolunteer && [
            { icon: Sparkles, value: selectedVolunteer.skillsCount ?? 0, label: 'Skills' },
            { icon: Megaphone, value: selectedVolunteer.opportunitiesJoinedCount ?? 0, label: 'Opportunities joined' },
          ]
        }
        statsNote="Platform-wide totals — not tied to a single organization."
      />
    </AdminLayout>
  )
}
