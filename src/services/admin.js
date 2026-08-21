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
import { OPPORTUNITY_STATUS } from '../constants/opportunityStatus'
import { loadMockUsers, updateMockUser } from './mock/mockUserStore'
import { MOCK_OPPORTUNITIES } from './mock/mockOpportunitiesStore'
import { getEffectiveOpportunityStatus } from '../utils/opportunityStatus'

const MOCK_MODE = isMockMode()

// تواريخ نسبية لـ Date.now() بدل تواريخ تقويمية ثابتة — نفس نمط
// mockOpportunitiesStore.js بالضبط، حتى بطاقة "This week" بالداشبورد
// تلاقي دايمًا عناصر ضمن آخر 7 أيام بغض النظر عن تاريخ فتح المشروع
function daysFromNow(offset) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString()
}

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

// ═══════════════════════════════════════════════════════════════════
// عرض ومراقبة فقط (Read-only) — قوائم المتطوعين والفرص بلوحة الأدمن.
// لا يوجد أي إجراء (تعليق/حذف/تعديل) على أي منهما، فقط جلب للعرض.
//
// ⚠️ الباك اند الحقيقي: نفس وضع reviewOrganization أعلاه — الـ routes
// التالية لم تُضَف بعد بمستودع الباك اند:
//   GET /api/admin/volunteers
//   GET /api/admin/opportunities
// المتوقّع محميّتين بنفس middleware('role:admin').
//
// بوضع Mock — المتطوعون: مصفوفة ثابتة محلية منفصلة (مش مبنية من
// mockUserStore الحقيقي) — حتى نضمن دايمًا 8-10 متطوعين بتواريخ إنشاء
// متنوعة تغطي آخر أسبوعين على الأقل، بغض النظر عمّا سجّله المستخدم
// فعليًا بالمتصفح، لتبقى بطاقة "This week" بالداشبورد قابلة للاختبار
// دايمًا. لا مشكلة هون لأنه ما في تنقّل لصفحة تفاصيل منفصلة بمعرّف
// المتطوع (المعاينة بمودال مباشر من نفس البيانات، راجع AdminVolunteers.jsx).
//
// بوضع Mock — الفرص: بعكس المتطوعين، هون لازم نُعيد استخدام المخزن
// الحقيقي (MOCK_OPPORTUNITIES بـ mockOpportunitiesStore.js) بدل مصفوفة
// منفصلة — نفس مبدأ fetchAdminOrganizationList أعلاه بالضبط. السبب:
// AdminOpportunities.jsx بينقل الأدمن لصفحة تفاصيل الفرصة العامة
// (OpportunityDetailsPage) بنفس الـ id، فلو المعرّفات مش من نفس المخزن
// الفرصة كانت رح تظهر "could not be found" رغم إنها معروضة بالقائمة —
// بالضبط الـ bug يلي كان موجود هون قبل هالتعديل.
// ═══════════════════════════════════════════════════════════════════

const MOCK_ADMIN_VOLUNTEERS = [
  { id: 'v1', name: 'Lina Haddad', email: 'lina.haddad@example.com', city: 'Damascus', createdAt: daysFromNow(-1), skillsCount: 4, opportunitiesJoinedCount: 3 },
  { id: 'v2', name: 'Omar Al-Khatib', email: 'omar.khatib@example.com', city: 'Aleppo', createdAt: daysFromNow(-2), skillsCount: 2, opportunitiesJoinedCount: 1 },
  { id: 'v3', name: 'Sara Youssef', email: 'sara.youssef@example.com', city: 'Homs', createdAt: daysFromNow(-4), skillsCount: 5, opportunitiesJoinedCount: 6 },
  { id: 'v4', name: 'Khaled Mostafa', email: 'khaled.mostafa@example.com', city: 'Latakia', createdAt: daysFromNow(-6), skillsCount: 3, opportunitiesJoinedCount: 2 },
  { id: 'v5', name: 'Nour Al-Amin', email: 'nour.alamin@example.com', city: 'Tartus', createdAt: daysFromNow(-8), skillsCount: 1, opportunitiesJoinedCount: 0 },
  { id: 'v6', name: 'Rami Sabbagh', email: 'rami.sabbagh@example.com', city: 'Hama', createdAt: daysFromNow(-10), skillsCount: 6, opportunitiesJoinedCount: 4 },
  { id: 'v7', name: 'Dana Kanaan', email: 'dana.kanaan@example.com', city: 'Daraa', createdAt: daysFromNow(-13), skillsCount: 2, opportunitiesJoinedCount: 2 },
  { id: 'v8', name: 'Yousef Barakat', email: 'yousef.barakat@example.com', city: 'Idlib', createdAt: daysFromNow(-18), skillsCount: 3, opportunitiesJoinedCount: 1 },
  { id: 'v9', name: 'Mona Al-Sayed', email: 'mona.alsayed@example.com', city: 'Al-Hasakah', createdAt: daysFromNow(-25), skillsCount: 4, opportunitiesJoinedCount: 5 },
]

// يحوّل فرصة من المخزن الحقيقي (MOCK_OPPORTUNITIES) لشكل قائمة الأدمن —
// نفس فلسفة toOrganizationSummary أعلاه بالضبط. status محسوبة عبر
// getEffectiveOpportunityStatus (مش الحقل الخام status بالمخزن، يلي هو
// فقط 'open'/'closed' قديم — راجع تعليق مطابق بـ mockOpportunitiesStore.js)
function toAdminOpportunitySummary(opportunity) {
  return {
    id: opportunity.id,
    title: opportunity.title || '',
    organizationName: opportunity.organization?.name || '',
    city: opportunity.location || '',
    status: getEffectiveOpportunityStatus(opportunity),
    createdAt: opportunity.createdAt || null,
    startDate: opportunity.startDate || null,
  }
}

function mapApiVolunteer(raw) {
  if (!raw) return null

  return {
    id: raw.id,
    name: raw.name || [raw.first_name, raw.last_name].filter(Boolean).join(' '),
    email: raw.email || '',
    city: raw.city || '',
    createdAt: raw.created_at || raw.createdAt || null,
    skillsCount: raw.skills_count ?? raw.skillsCount,
    opportunitiesJoinedCount: raw.opportunities_joined_count ?? raw.opportunitiesJoinedCount,
  }
}

/**
 * يجلب كل المتطوعين المسجّلين بالمنصة — عرض ومراقبة فقط، بلا أي فلترة
 * أو إجراء.
 * @returns {Promise<Array<object>>}
 */
export async function fetchAdminVolunteers() {
  if (MOCK_MODE) {
    await wait()
    return MOCK_ADMIN_VOLUNTEERS
  }

  try {
    const response = await apiClient.get('/admin/volunteers')
    const list = Array.isArray(response.data) ? response.data : response.data?.data || []
    return list.map(mapApiVolunteer)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load admin volunteers'), { cause: error })
  }
}

function mapApiOpportunity(raw) {
  if (!raw) return null

  return {
    id: raw.id,
    title: raw.title || '',
    organizationName: raw.organization_name || raw.organizationName || raw.organization?.name || '',
    city: raw.city || raw.location || '',
    status: raw.status || OPPORTUNITY_STATUS.REGISTRATION_OPEN,
    createdAt: raw.created_at || raw.createdAt || null,
    startDate: raw.start_date || raw.startDate || null,
  }
}

/**
 * يجلب كل الفرص المنشورة على المنصة — عرض ومراقبة فقط، بلا أي فلترة
 * أو إجراء.
 * @returns {Promise<Array<object>>}
 */
export async function fetchAdminOpportunities() {
  if (MOCK_MODE) {
    await wait()
    return MOCK_OPPORTUNITIES.map(toAdminOpportunitySummary)
  }

  try {
    const response = await apiClient.get('/admin/opportunities')
    const list = Array.isArray(response.data) ? response.data : response.data?.data || []
    return list.map(mapApiOpportunity)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load admin opportunities'), { cause: error })
  }
}