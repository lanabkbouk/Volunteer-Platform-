// مخزن Mock مشترك لبيانات المشاركات (participations).
//
// ليش ملف مستقل؟ لأنه opportunities.js (participateInOpportunity) صار
// محتاج "يكتب" سجل مشاركة جديد لحظة الانضمام، وparticipations.js
// (fetchApplicantsForOpportunity) هو يلي "يقرأ" هالسجلات لعرضها للمنظمة.
// لو استوردنا participations.js مباشرة جوا opportunities.js كان رح
// يصير Circular Import (participations.js نفسها أصلًا بتستورد
// fetchOpportunities من opportunities.js) — فبدل هيك، الملفين بيعتمدوا
// سوا على هالمصدر المشترك الوحيد.

import { PARTICIPATION_STATUS } from '../../constants/participationStatus'
import {
  MOCK_PARTICIPATIONS_STORAGE_KEY,
  MOCK_VOLUNTEER_PROFILES_STORAGE_KEY,
} from '../../constants/auth/storage'

// نفس نمط daysFromNow المستخدم بـ mockOpportunitiesStore.js — تواريخ
// نسبية لـ Date.now() بدل تواريخ تقويمية ثابتة، وإلا joinedDate كانت
// رح تصير "بالمستقبل" (أو بعيدة جدًا عن opportunityId المرتبطة فيها)
// بمجرد ما التاريخ الحقيقي يتخطى التاريخ المكتوب يدويًا
function daysFromNow(offset) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

// تحميل نسخة محفوظة من localStorage (تعديلات سابقة: قبول/رفض/سحب/ساعات
// مؤكدة...) لو موجودة وصالحة، وإلا البيانات الأصلية بالأسفل. بدون هالحفظ،
// أي Refresh كامل للصفحة (F5) كان يرجّع كل تعديل صار بجلسة Mock سابقة
// لأصله بصمت — ويكسر أي تنبيه (services/notifications.js) بيعتمد على
// تغيّر فعلي بالحالة تمّ اختباره قبل الـ Refresh
function loadMockParticipations() {
  try {
    const raw = localStorage.getItem(MOCK_PARTICIPATIONS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : INITIAL_PARTICIPATIONS
  } catch {
    return INITIAL_PARTICIPATIONS
  }
}

function loadMockVolunteerProfiles() {
  try {
    const raw = localStorage.getItem(MOCK_VOLUNTEER_PROFILES_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : INITIAL_VOLUNTEER_PROFILES
  } catch {
    return INITIAL_VOLUNTEER_PROFILES
  }
}

// ⚠️ كل مشاركة هلق فيها volunteerId ثابت — قبل هيك، كل لقطة متقدم
// كانت معزولة عن باقي مشاركات نفس المتطوع (حتى لو كان نفس الشخص شارك
// بفرص تانية)، فكان مستحيل نحسب إحصائيات حقيقية (ساعات/فرص مكتملة).
// هلق: نفس volunteerId بيتكرر عبر أكتر من مشاركة/منظمة، فمنقدر نحسب
// "كم فرصة أكمل لدى هالمنظمة بالذات" مقابل "كم إجمالاً عالمنصة" بدقة.
//
// ملاحظة على التواريخ: joinedDate كل مشاركة محسوبة كـ daysFromNow
// بفارق سالب يطابق فارقها الأصلي عن opportunityId المرتبطة فيها (o1
// نشطة/معلّقة حاليًا، o5/o6 منتهيتين فعليًا) — فمهما كان تاريخ التشغيل
// الفعلي، attachComputedStatus بيحسب o5/o6 "completed" وo1 لسا نشطة،
// بنفس الشكل النسبي دايمًا.
const INITIAL_PARTICIPATIONS = [
  // — المتقدمين الحاليين على مراجعة (زي ما كانوا أصلًا) —
  { id: 'p1', volunteerId: 'v1', opportunityId: 'o1', status: PARTICIPATION_STATUS.PENDING, committedHours: 3, hoursLogged: null, joinedDate: daysFromNow(-11) },
  { id: 'p2', volunteerId: 'v2', opportunityId: 'o2', status: PARTICIPATION_STATUS.ACCEPTED, committedHours: 4, hoursLogged: null, joinedDate: daysFromNow(-16) },
  { id: 'p5', volunteerId: 'v3', opportunityId: 'o1', status: PARTICIPATION_STATUS.REJECTED, committedHours: 2, hoursLogged: null, joinedDate: daysFromNow(-82), rejectionReason: 'The opportunity reached its volunteer capacity before your application was reviewed.' },

  // — سجل تاريخي إضافي (فرص منتهية فعليًا)، لحساب إحصائيات حقيقية —
  // Lina (v1): فرصتين مكتملتين بمنظمتين غير org1 (فرصتها الحالية
  // بمراجعة p1 بالأعلى) — حتى يبان الفرق بين "لدى هالمنظمة" (0) و"إجمالاً" (2)
  { id: 'p20', volunteerId: 'v1', opportunityId: 'o6', status: PARTICIPATION_STATUS.ACCEPTED, committedHours: 6, hoursLogged: 6, joinedDate: daysFromNow(-400) },
  { id: 'p21', volunteerId: 'v1', opportunityId: 'o5', status: PARTICIPATION_STATUS.ACCEPTED, committedHours: 4, hoursLogged: 4, joinedDate: daysFromNow(-238) },
  { id: 'temp2', volunteerId: 'v-lana@example.com', opportunityId: 'o5', status: PARTICIPATION_STATUS.ACCEPTED, committedHours: 6, hoursLogged: 6, joinedDate: daysFromNow(-200) },

  // Omar (v2): فرصة مكتملة إضافية بنفس منظمة o2 (org2) + فرصتين
  // بمنظمات تانية — حتى يبان "لدى هالمنظمة" (1) مقابل "إجمالاً" (3)
  { id: 'p22', volunteerId: 'v2', opportunityId: 'o6', status: PARTICIPATION_STATUS.ACCEPTED, committedHours: 12, hoursLogged: 12, joinedDate: daysFromNow(-396) },
  { id: 'p23', volunteerId: 'v2', opportunityId: 'o5', status: PARTICIPATION_STATUS.ACCEPTED, committedHours: 15, hoursLogged: 15, joinedDate: daysFromNow(-243) },
  { id: 'p24', volunteerId: 'v2', opportunityId: 'o1', status: PARTICIPATION_STATUS.ACCEPTED, committedHours: 15, hoursLogged: 15, joinedDate: daysFromNow(-16) },

  // Maya (v3): فرصة مكتملة وحدة بس (منظمة تانية غير org1)
  { id: 'p25', volunteerId: 'v3', opportunityId: 'o6', status: PARTICIPATION_STATUS.ACCEPTED, committedHours: 5, hoursLogged: 5, joinedDate: daysFromNow(-391) },
  { id: 'temp1', volunteerId: 'v-lanaa@example.com', opportunityId: 'o6', status: PARTICIPATION_STATUS.ACCEPTED, committedHours: 6, hoursLogged: 6, joinedDate: daysFromNow(-200) },

  // — متطوعون إضافيون مقبولون بـ o5 (Winter Clothes Drive) — حتى يوصل
  // عدد المقبولين فعليًا لـ minVolunteers (16) وتظهر كـ "Success Story"
  // بالصفحة الرئيسية (راجع isSuccessfulOpportunity بـ utils/opportunityStatus.js).
  // بدون بروفايل كامل بـ MOCK_VOLUNTEER_PROFILES عمدًا: هالفرصة تابعة
  // لمنظمة تانية (org4) غير منظمة المستخدم الحالي (org-mock)، فما رح
  // تنعرض بصفحة "قائمة المتقدمين" لدينا أصلًا — العدد فقط هو المطلوب هون
  { id: 'p26', volunteerId: 'v4', opportunityId: 'o5', status: PARTICIPATION_STATUS.ACCEPTED, committedHours: 3, hoursLogged: 3, joinedDate: daysFromNow(-84) },
  { id: 'p27', volunteerId: 'v5', opportunityId: 'o5', status: PARTICIPATION_STATUS.ACCEPTED, committedHours: 3, hoursLogged: 3, joinedDate: daysFromNow(-84) },
  { id: 'p28', volunteerId: 'v6', opportunityId: 'o5', status: PARTICIPATION_STATUS.ACCEPTED, committedHours: 4, hoursLogged: 4, joinedDate: daysFromNow(-83) },

]

export const MOCK_PARTICIPATIONS = loadMockParticipations()

// بروفايل كل متطوع — مفتاح المصفوفة هلق volunteerId (مش participation
// id)، لأنه بروفايل يخص شخص، مش طلب مشاركة واحد بعينه
//
// ⚠️ email مضاف هون عمدًا لكل بروفايل — بالباك اند الحقيقي (Laravel)
// حقل الإيميل موجود دايمًا ضمن VolunteerResource (user.email، إلزامي
// بجدول users)، فمينيك أي بروفايل متطوع حقيقي بيوصل بدونه. بيانات
// الـ Mock هون لازم تطابق هالواقع وإلا نختبر شاشة بشكل مختلف عن شكلها
// الحقيقي بعد ربط الـ API
const INITIAL_VOLUNTEER_PROFILES = {
  v1: {
    volunteerId: 'v1', name: 'Lama Haddad', photo: null, city: 'Damascus',
    skills: ['First Aid', 'Communication'], phone: '+963911111111', email: 'lama.haddad@example.com',
    educationLevel: "Bachelor's Degree", dateOfBirth: '2001-03-14', gender: 'female',
  },
  v2: {
    volunteerId: 'v2', name: 'Omar Khalil', photo: null, city: 'Aleppo',
    skills: ['Teaching'], phone: '+963922222222', email: 'omar.khalil@example.com',
    educationLevel: 'Diploma', dateOfBirth: '1997-09-02', gender: 'male',
  },
  v3: {
    volunteerId: 'v3', name: 'Maya Saleh', photo: null, city: 'Damascus',
    skills: ['Photography'], phone: '+963955555555', email: 'maya.saleh@example.com',
    educationLevel: 'High School', dateOfBirth: '2004-11-20', gender: 'female',
  },
}

export const MOCK_VOLUNTEER_PROFILES = loadMockVolunteerProfiles()

// تُستدعى بعد أي تعديل على MOCK_PARTICIPATIONS أو MOCK_VOLUNTEER_PROFILES
// (راجع services/participations.js وaddMockParticipation تحت) — حتى
// تنجو التعديلات من أي Refresh كامل للصفحة بدل ما ترجع لقيمها الأصلية
export function persistMockParticipations() {
  try {
    localStorage.setItem(MOCK_PARTICIPATIONS_STORAGE_KEY, JSON.stringify(MOCK_PARTICIPATIONS))
  } catch {
    // تجاهل أي خطأ تخزين (تصفح خاص أو تجاوز الحصة) — نفس نمط
    // participationStatusSeenTracker.js
  }
}

export function persistMockVolunteerProfiles() {
  try {
    localStorage.setItem(MOCK_VOLUNTEER_PROFILES_STORAGE_KEY, JSON.stringify(MOCK_VOLUNTEER_PROFILES))
  } catch {
    // تجاهل
  }
}

/**
 * يضيف سجل مشاركة جديد لحظة ما متطوع (بوضع Mock) يضغط "Confirm & Join" —
 * هاي الدالة بالذات هي يلي بتربط انضمام المتطوع فعليًا بقائمة
 * المتقدمين يلي بتشوفها المنظمة، بدل ما يضلّوا معزولين عن بعض.
 * @param {{opportunityId: string, committedHours: number, volunteerProfile: object}} params
 * @returns {object} سجل المشاركة الجديد
 */
export function addMockParticipation({ opportunityId, committedHours, volunteerProfile }) {
  // volunteerId ثابت لنفس الإيميل — لو نفس المتطوع انضم أكتر من مرة
  // (فرص مختلفة)، بيرجع يترقّم تلقائيًا تحت نفس الهوية، مش هويات
  // متفرقة كل مرة يشارك فيها
  const volunteerId = volunteerProfile.email ? `v-${volunteerProfile.email}` : `v-${Date.now()}`

  const participation = {
    id: `p${Date.now()}`,
    volunteerId,
    opportunityId,
    status: PARTICIPATION_STATUS.PENDING,
    committedHours,
    hoursLogged: null,
    joinedDate: new Date().toISOString().slice(0, 10),
  }

  MOCK_PARTICIPATIONS.push(participation)
  MOCK_VOLUNTEER_PROFILES[volunteerId] = { volunteerId, ...volunteerProfile }
  persistMockParticipations()
  persistMockVolunteerProfiles()

  return participation
}