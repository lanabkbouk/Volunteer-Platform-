// components/orgProfile/VerificationStatusBanner.jsx
//
// يعرض حالة توثيق المنظمة بشكل واضح بأعلى الصفحة. لا يظهر إطلاقًا لما
// تكون الحالة "verified" لأنه ما في داعي نزعج منظمة موثّقة برسالة دائمة.
//
// ⚠️ hasLoadError مختلف تمامًا عن "لا توجد حالة": لو فشل تحميل بيانات
// المنظمة من السيرفر (خطأ شبكة، أو الـ API ما رجّع بيانات لأي سبب)، لازم
// يظهر تنبيه واضح بدل ما نصمت ونخلي المستخدم يعتقد إنه كل شي تمام.

import { Clock, CheckCircle2, XCircle, Ban, AlertTriangle } from 'lucide-react'
import { ORGANIZATION_STATUS, getOrganizationStatusMeta } from '../../constants/organizationStatus'

const STATUS_ICONS = {
  [ORGANIZATION_STATUS.PENDING]: Clock,
  [ORGANIZATION_STATUS.VERIFIED]: CheckCircle2,
  [ORGANIZATION_STATUS.REJECTED]: XCircle,
  [ORGANIZATION_STATUS.SUSPENDED]: Ban,
}

export default function VerificationStatusBanner({ status, rejectionReason, hasLoadError = false }) {
  if (hasLoadError) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-3xl border p-6 md:p-8 mb-8 bg-red-50 border-red-200 text-red-800"
      >
        <AlertTriangle size={20} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Couldn't load verification status</p>
          <p className="text-sm mt-1">
            We couldn't reach the server to check your organization's status right now. Please refresh the page or try again shortly.
          </p>
        </div>
      </div>
    )
  }

  if (!status || status === ORGANIZATION_STATUS.VERIFIED) return null

  const meta = getOrganizationStatusMeta(status)
  const Icon = STATUS_ICONS[status] ?? Clock

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-3xl border p-6 md:p-8 mb-8 ${meta.bannerClassName}`}
    >
      <Icon size={20} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold">{meta.label}</p>
        <p className="text-sm mt-1">{meta.message}</p>
        {(status === ORGANIZATION_STATUS.REJECTED || status === ORGANIZATION_STATUS.SUSPENDED) &&
          rejectionReason && <p className="text-sm mt-2 italic">"{rejectionReason}"</p>}
      </div>
    </div>
  )
}