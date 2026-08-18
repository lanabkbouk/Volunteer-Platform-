import { Ban, Building2, Eye, Mail, Phone } from 'lucide-react'

import Badge from '../common/Badge'
import Button from '../ui/Button'
import Typography from '../ui/Typography'
import { CARD_BASE } from '../../utils/surfaceStyles'
import { ORGANIZATION_STATUS } from '../../constants/organizationStatus'
import { formatDateTime } from '../../utils/formatDateTime'

function getStatusTone(status) {
  if (status === ORGANIZATION_STATUS.VERIFIED) return 'success'
  if (status === ORGANIZATION_STATUS.REJECTED || status === ORGANIZATION_STATUS.SUSPENDED) return 'danger'
  return 'warning'
}

function getStatusLabel(status) {
  if (status === ORGANIZATION_STATUS.VERIFIED) return 'Approved'
  if (status === ORGANIZATION_STATUS.REJECTED) return 'Rejected'
  if (status === ORGANIZATION_STATUS.SUSPENDED) return 'Suspended'
  return 'Pending'
}

export default function OrganizationReviewCard({
  organization,
  onApprove,
  onReject,
  onSuspend,
  onViewDetails,
  isUpdating,
}) {
  const status = organization?.status || ORGANIZATION_STATUS.PENDING
  const statusTone = getStatusTone(status)
  const isVerified = status === ORGANIZATION_STATUS.VERIFIED
  const isRejected = status === ORGANIZATION_STATUS.REJECTED
  // منظمة معلَّقة (Suspended) كانت موثَّقة أصلًا — نفس الزر/المعالج
  // (onApprove) بيرجّعها لحالة verified، بس النص لازم يعكس "إعادة تفعيل"
  // مش "موافقة أولى" حتى ما يلتبس الأدمن وهو يراجع طابور فيه معلّقة وpending سوا
  const isSuspended = status === ORGANIZATION_STATUS.SUSPENDED

  return (
    <article className={`${CARD_BASE} p-5 md:p-6`}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
            {organization.imageUrl ? (
              <img
                src={organization.imageUrl}
                alt={organization.name || 'Organization logo'}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 size={24} aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Typography variant="h5" className="truncate">
                {organization.name || 'Untitled organization'}
              </Typography>
              <Badge label={getStatusLabel(status)} tone={statusTone} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-body">
              <span className="inline-flex items-center gap-2 truncate">
                <Mail size={14} aria-hidden="true" />
                {organization.email || 'No email provided'}
              </span>
              <span className="inline-flex items-center gap-2">
                <Phone size={14} aria-hidden="true" />
                {organization.phone || 'No phone provided'}
              </span>
              <span className="text-body/80">
                Registered {formatDateTime(organization.requestedAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <Button variant="ghost" size="small" onClick={() => onViewDetails(organization)}>
            <Eye size={16} />
            <span className="ml-1">View details</span>
          </Button>
          <Button
            variant="success"
            size="small"
            disabled={isUpdating || isVerified}
            isLoading={isUpdating}
            loadingText={isSuspended ? 'Reinstating...' : 'Approving...'}
            onClick={() => onApprove(organization)}
          >
            {isSuspended ? 'Reinstate organization' : 'Approve verification'}
          </Button>
          <Button
            variant="danger"
            size="small"
            disabled={isUpdating || isRejected}
            onClick={() => onReject(organization)}
          >
            Reject verification
          </Button>
          {/* التعليق منطقي فقط لمنظمة موثَّقة أصلًا — منظمة pending
              أو rejected أصلًا خارج نظام النشر، تعليقها بلا معنى */}
          {isVerified && (
            <Button
              variant="ghost"
              size="small"
              disabled={isUpdating}
              onClick={() => onSuspend(organization)}
              className="flex items-center gap-1 text-heading/60 hover:bg-heading/5"
            >
              <Ban size={16} />
              Suspend
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}