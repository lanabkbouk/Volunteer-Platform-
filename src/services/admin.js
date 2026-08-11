// خدمات شاشة الأدمن — مراجعة طلبات توثيق المنظمات (قبول/رفض).
//
// ⚠️ الباك اند الحقيقي: لم تُضَف هذه الـ routes بعد (راجع routes/api.php
// بمستودع  — يوجد فقط auth + CRUD عادي لـ categories/organizations/
// volunteers، بدون أي namespace خاص بالأدمن). المتوقّع لاحقًا:
//   GET   /api/admin/organizations?status=pending
//   PATCH /api/admin/organizations/{id}/verify   { status, reason? }
// محميّة بـ middleware('role:admin') عبر Spatie/laravel-permission
// (المكتبة مثبّتة أصلًا بالباك اند، بس الدور والـ routes لسا ما انضافوا).
//
// بوضع Mock: لا نبني array وهمي منفصل — نُعيد استخدام mockUserStore
// نفسه (نفس المخزن اللي بيسجّل فيه أي منظمة حساب جديد فعليًا)، حتى
// تكون تجربة الأدمن مطابقة تمامًا لما بيصير بالواقع بدل بيانات معزولة.

import { apiClient, getApiErrorMessage } from './api/client'
import { isMockMode } from './api/mockMode'
import { wait } from './api/delay'
import { ACCOUNT_TYPES } from '../constants/auth/accountTypes'
import { ORGANIZATION_STATUS } from '../constants/organizationStatus'
import { loadMockUsers, updateMockUser } from './mock/mockUserStore'

const MOCK_MODE = isMockMode()

/**
 * يحوّل مستخدم Mock (accountType=organization) لشكل موحّد يشبه
 * OrganizationResource الحقيقي القادم من الباك اند لاحقًا — حتى
 * الـ Component ما يهمه إطلاقًا إذا كان المصدر Mock أو API حقيقي.
 */
function toOrganizationSummary(mockUser) {
  return {
    id: mockUser.organizationId,
    name: mockUser.orgName || '',
    email: mockUser.email || '',
    contactPerson: mockUser.contactPerson || '',
    phone: mockUser.phone || '',
    city: mockUser.city || '',
    website: mockUser.website || '',
    imageUrl: mockUser.imageUrl || null,
    verificationDocumentUrl: mockUser.verificationDocumentUrl || null,
    // نفس منطق fetchOrganizationProfile بالضبط: مافي status مخزّن
    // صراحة إلا بعد أول قرار مراجعة → قبلها تُعتبر pending دايمًا
    status: mockUser.status || ORGANIZATION_STATUS.PENDING,
    requestedAt: mockUser.createdAt || null,
    rejectionReason: mockUser.rejectionReason || '',
    reviewedAt: mockUser.reviewedAt || null,
  }
}

function mapApiOrganization(raw) {
  if (!raw) return null

  return {
    id: raw.id,
    name: raw.name || raw.org_name || '',
    email: raw.email || raw.owner?.email || '',
    contactPerson: raw.contact_person || raw.contactPerson || '',
    phone: raw.phone || raw.phone_number || '',
    city: raw.city || '',
    website: raw.website || '',
    imageUrl: raw.image_url || raw.profile_image || raw.avatar_url || null,
    verificationDocumentUrl: raw.verification_document_url || raw.verificationDocumentUrl || null,
    status: raw.status || ORGANIZATION_STATUS.PENDING,
    requestedAt: raw.created_at || raw.createdAt || raw.requested_at || null,
    rejectionReason: raw.rejection_reason || raw.rejectionReason || '',
    reviewedAt: raw.reviewed_at || raw.reviewedAt || null,
  }
}

async function fetchAdminOrganizationList({ status } = {}) {
  if (MOCK_MODE) {
    await wait()

    return loadMockUsers()
      .filter((user) => user.accountType === ACCOUNT_TYPES.ORGANIZATION)
      .filter((user) => !status || (user.status || ORGANIZATION_STATUS.PENDING) === status)
      .map(toOrganizationSummary)
  }

  try {
    const response = await apiClient.get('/admin/organizations', {
      params: status ? { status } : undefined,
    })

    const list = Array.isArray(response.data) ? response.data : response.data?.data || []
    return list.map(mapApiOrganization)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load admin organizations'))
  }
}

export async function fetchAdminOrganizations() {
  return fetchAdminOrganizationList()
}

/**
 * يجلب المنظمات اللي لسا بانتظار قرار الأدمن (status=pending فقط).
 * @returns {Promise<Array<object>>}
 */
export async function fetchPendingOrganizations() {
  return fetchAdminOrganizationList({ status: ORGANIZATION_STATUS.PENDING })
}

/**
 * ينفّذ قرار الأدمن على منظمة معيّنة: توثيق أو رفض، مع سبب اختياري
 * (يُعرض للمنظمة لاحقًا عبر VerificationStatusBanner الموجود أصلًا).
 * نفس نمط updateParticipationStatus: يرجّع {success,error} بدل ما يرمي
 * استثناء، لأنه فشل قرار واحد ما لازم يكسر باقي القائمة المعروضة.
 *
 * @param {string|number} organizationId
 * @param {{status: 'verified'|'rejected'|'suspended', reason?: string}} decision
 */
export async function reviewOrganization(organizationId, decision) {
  const trimmedReason = String(decision?.reason || '').trim()

  // السبب إلزامي لأي قرار سلبي (رفض أو تعليق) — وليس القبول، بنفس
  // منطق VerificationDecisionModal.jsx بالضبط
  const requiresReason =
    decision?.status === ORGANIZATION_STATUS.REJECTED || decision?.status === ORGANIZATION_STATUS.SUSPENDED

  if (requiresReason && !trimmedReason) {
    const label = decision.status === ORGANIZATION_STATUS.SUSPENDED ? 'Suspension' : 'Rejection'
    return { success: false, error: `${label} reason is required` }
  }

  if (MOCK_MODE) {
    await wait()

    const mockUser = loadMockUsers().find((user) => user.organizationId === organizationId)
    if (!mockUser) return { success: false, error: 'Organization not found' }

    const reviewedAt = new Date().toISOString()
    updateMockUser(mockUser.email, {
      status: decision.status,
      rejectionReason: requiresReason ? trimmedReason : '',
      reviewedAt,
    })

    return { success: true, status: decision.status, reason: trimmedReason, reviewedAt }
  }

  try {
    await apiClient.patch(`/admin/organizations/${organizationId}/verify`, {
      status: decision.status,
      reason: trimmedReason || undefined,
    })
    return { success: true, status: decision.status, reason: trimmedReason }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to submit this decision') }
  }
}