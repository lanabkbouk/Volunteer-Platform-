import { useState } from 'react'
import { Building2, ExternalLink, Image as ImageIcon, Maximize2 } from 'lucide-react'

import Badge from '../common/Badge'
import EmptyState from '../common/EmptyState'
import InfoRow from '../ui/InfoRow'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Typography from '../ui/Typography'
import { ORGANIZATION_STATUS } from '../../constants/organizationStatus'
import { formatDateTime } from '../../utils/formatDateTime'

function getStatusTone(status) {
  if (status === ORGANIZATION_STATUS.VERIFIED) return 'success'
  if (status === ORGANIZATION_STATUS.REJECTED) return 'danger'
  return 'warning'
}

function getStatusLabel(status) {
  if (status === ORGANIZATION_STATUS.VERIFIED) return 'Approved'
  if (status === ORGANIZATION_STATUS.REJECTED) return 'Rejected'
  return 'Pending'
}

export default function AdminOrganizationDetailsModal({
  open,
  organization,
  onClose,
  onApprove,
  onReject,
  isSubmitting,
}) {
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false)

  const status = organization?.status || ORGANIZATION_STATUS.PENDING
  const statusTone = getStatusTone(status)
  const isVerified = status === ORGANIZATION_STATUS.VERIFIED
  const isRejected = status === ORGANIZATION_STATUS.REJECTED
  // مطلوب إجباريًا عند التسجيل (صورة فقط — راجع validation.js
  // requiredFile + accept="image/jpeg,image/png,image/webp" بـ orgForm.jsx)،
  // فما في داعي لدعم أنواع ملفات تانية (PDF...). بس منّا نفترض إنها موجودة
  // دايمًا 100%: منظمات قديمة/تجريبية أو استجابة API ناقصة ممكن توصل بدون
  // رابط، فبنبقي حارس بسيط hasVerificationDocument لعرض حالة فارغة واضحة
  // بدل صورة مكسورة (src فاضي) ورابط "Open file" بلا وجهة.
  const verificationDocumentUrl = organization?.verificationDocumentUrl || ''
  const hasVerificationDocument = Boolean(verificationDocumentUrl)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Organization details"
      dialogClassName="max-w-2xl"
      scrollBody
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
          <Button
            variant="success"
            onClick={() => onApprove?.(organization)}
            disabled={isSubmitting || isVerified}
            isLoading={isSubmitting}
            loadingText="Approving..."
          >
            Approve
          </Button>
          <Button
            variant="danger"
            onClick={() => onReject?.(organization)}
            disabled={isSubmitting || isRejected}
          >
            Reject
          </Button>
        </>
      }
    >
      {organization && (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary/10 text-secondary">
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
                <Typography variant="h4" className="truncate">
                  {organization.name || 'Organization'}
                </Typography>
                <Badge label={getStatusLabel(status)} tone={statusTone} />
              </div>

              <Typography variant="bodySm" className="mt-1 text-body">
                {organization.email || 'No email provided'}
              </Typography>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Email" value={organization.email || '—'} />
            <InfoRow label="Phone" value={organization.phone || '—'} />
            <InfoRow label="Registered" value={formatDateTime(organization.requestedAt)} />
            <InfoRow label="City" value={organization.city || '—'} />
            <InfoRow label="Contact person" value={organization.contactPerson || '—'} />
            <InfoRow label="Website" value={organization.website || '—'} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Verification status" value={getStatusLabel(status)} />
            <InfoRow label="Rejection reason" value={organization.rejectionReason || '—'} />
            {organization.reviewedAt ? (
              <InfoRow label="Reviewed at" value={formatDateTime(organization.reviewedAt)} />
            ) : null}
          </div>

          <section className="rounded-2xl border border-heading/10 bg-bg/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Typography variant="h5">Verification document</Typography>
                <Typography variant="bodySm" className="mt-1 text-body">
                  The uploaded official document is shown below and can be opened larger when needed.
                </Typography>
              </div>

              <Button
                variant="ghost"
                size="small"
                onClick={() => setIsDocumentPreviewOpen(true)}
                disabled={!hasVerificationDocument}
              >
                <Maximize2 size={16} />
                <span className="ml-1">Open larger preview</span>
              </Button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-heading/10 bg-bg">
              {hasVerificationDocument ? (
                <img
                  src={verificationDocumentUrl}
                  alt={`${organization.name || 'Organization'} verification document`}
                  className="max-h-[22rem] w-full object-contain"
                />
              ) : (
                <EmptyState
                  icon={ImageIcon}
                  title="No verification document uploaded"
                  description="This organization has no verification document on file yet."
                />
              )}
            </div>

            {hasVerificationDocument && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button as="a" variant="ghost" size="small" href={verificationDocumentUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} />
                  <span className="ml-1">Open file in new tab</span>
                </Button>
                <Typography variant="bodySm" className="text-body">
                  Image file preview
                </Typography>
              </div>
            )}
          </section>
        </div>
      )}

      <Modal
        open={isDocumentPreviewOpen}
        onClose={() => setIsDocumentPreviewOpen(false)}
        title="Verification document preview"
        dialogClassName="max-w-5xl"
        scrollBody
      >
        {hasVerificationDocument ? (
          <div className="space-y-4">
            <Typography variant="bodySm" className="text-body">
              Review the uploaded document in a larger view. Use the file link if your browser blocks embedded previews.
            </Typography>

            <div className="overflow-hidden rounded-2xl border border-heading/10 bg-bg">
              <img
                src={verificationDocumentUrl}
                alt={`${organization?.name || 'Organization'} verification document preview`}
                className="max-h-[75vh] w-full object-contain"
              />
            </div>
          </div>
        ) : (
          <Typography variant="bodySm" className="text-body">
            No verification document is available for this organization.
          </Typography>
        )}
      </Modal>
    </Modal>
  )
}