// الإنجازات المقفلة / غير المقفلة
// يعرض ملف تعريف المتطوعين كتالوج الإنجاز الكامل (وليس فقط
// تلك التي تكسب بالفعل) حتى يتمكنوا من رؤية ما لا يزال أمامهم - مقفل
// يتم تقديم الإنجازات في الرمادي مع اسمها الحقيقي / وصفها ،
// تظهر تلك المقفلة بالألوان الكاملة مع تاريخ كسبها.
// هذا يعني أن واجهة برمجة التطبيقات يجب أن تعيد كل تعريف للإنجاز ، ولكل منها: ////
// - غير مقفل: boolean
// - المكتسبةالتاريخ: سلسلة | null (لاغية أثناء قفل)
//
// هام - من يمنح إنجازا:
// منح هو تماما قاعدة الأعمال الخلفية، وليس شيئا مجموعة المشرف
// يدويا وليس شيئا تقرر في الواجهة الأمامية. القواعد هي:
// - أول فرصة مكتملة
// - 10 ساعات تطوعية تراكمية
// - 3 فرص جماعية مكتملة
// يجب على Laravel تقييم هذه تلقائيًا (على سبيل المثال حدث / مراقب نموذجي
// التي يتم تشغيلها عند اكتمال المشاركة) وقلب "غير مقفلة" إلى
// صحيح + مجموعة "كرند دايت" بمجرد استيفاء قاعدة. يعرض هذا الملف فقط
// مهما كانت عودة API - لا شيء عن أي إنجازات موجودة ، أو
// سواء كانت مقفلة ، فهي مشفرة على العميل.
import { apiClient, getApiErrorMessage } from './api/client'
import { isMockMode } from './api/mockMode'
import { wait } from './api/delay'
import { MOCK_PARTICIPATIONS } from './mock/mockParticipationsStore'
import { MOCK_OPPORTUNITIES } from './mock/mockOpportunitiesStore'
import { PARTICIPATION_STATUS } from '../constants/participationStatus'
import { OPPORTUNITY_STATUS } from '../constants/opportunityStatus'
import { AUTH_STORAGE_KEY } from '../constants/auth/storage'
import { getEffectiveOpportunityStatus } from '../utils/opportunityStatus'
import { buildVolunteerHoursSummary } from '../utils/volunteerHoursSummary'

const MOCK_MODE = isMockMode()

// تعريفات الإنجازات (بدون unlocked/earnedDate ثابتين — هلق بيتحسبوا
// فعليًا لكل متطوع لحاله، مش قيمة واحدة ثابتة للجميع)
const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'a1',
    name: 'First Volunteering Opportunity',
    description: 'Completed your first volunteering opportunity.',
  },
  {
    id: 'a2',
    name: '10 Volunteer Hours',
    description: 'Reached 10 cumulative volunteering hours.',
  },
  {
    id: 'a3',
    name: 'Completion of Three Group Activities',
    description: 'Completed 3 group volunteering opportunities.',
  },
]

/**
 * نواة حساب حالة فتح كل إنجاز — دالة نقية (Pure) تاخد قائمة مشاركات
 * مُجهَّزة مسبقًا (نفس شكل fetchMyParticipations: كل عنصر معه
 * participation.opportunity كاملة، وopportunity.status هي الحالة
 * الفعلية المحسوبة). مفصولة عمدًا عن computeAchievementsForVolunteer
 * تحت (يلي بيبني هالقائمة من MOCK_PARTICIPATIONS/MOCK_OPPORTUNITIES)
 * حتى تنكتب اختبارات وحدة مباشرة عليها بمعطيات ثابتة، بدل الاعتماد على
 * بيانات mock مشتركة وتواريخها النسبية (daysFromNow) المتغيّرة مع
 * الوقت الحقيقي — راجع achievements.test.js
 * @param {Array<{status:string, joinedDate:string, opportunity:{status:string, isGroup?:boolean}|null}>} participations
 */
export function computeAchievementsFromParticipations(participations) {
  const { totalConfirmedHours, completedOpportunitiesCount } = buildVolunteerHoursSummary(participations)

  // نفس شرط "مكتملة ومقبولة" المستخدم جوا buildVolunteerHoursSummary —
  // معاد هون فقط لتحديد earnedDate (أقدم فرصة أكملها المتطوع)، مش لحساب
  // أي رقم ساعات من جديد
  const completed = participations.filter(
    (participation) =>
      participation.status === PARTICIPATION_STATUS.ACCEPTED &&
      participation.opportunity?.status === OPPORTUNITY_STATUS.COMPLETED,
  )

  // أقدم فرصة مكتملة (تاريخًا) — تُستخدم كـ earnedDate لإنجاز "أول فرصة"
  const earliestCompleted = [...completed].sort(
    (a, b) => new Date(a.joinedDate) - new Date(b.joinedDate),
  )[0]

  // ⚠️ إنجاز a3 اسمه صراحة "Completion of THREE GROUP Activities" — لازم
  // يتحقق فعليًا من isGroup === true على الفرصة، مش أي 3 فرص مكتملة
  // بغض النظر عن نوعها (كان الوضع سابقًا: نفس completedOpportunitiesCount
  // المستخدم لـ a1، بدون أي فلترة — تناقض مباشر بين وصف الإنجاز ومنطق
  // احتسابه). نفس شرط "مكتملة ومقبولة" أعلاه (completed)، بس مع فلتر
  // إضافي على opportunity.isGroup — راجع OpportunityCard.jsx/CauseForm.jsx
  // لنفس الفحص === true صراحة (مش أي قيمة فولسي) المستخدم بأماكن تانية
  const completedGroup = completed.filter(
    (participation) => participation.opportunity?.isGroup === true,
  )
  const completedGroupOpportunitiesCount = completedGroup.length

  // أقدم فرصة جماعية مكتملة تحديدًا — earnedDate الصحيح لـ a3، بدل
  // earliestCompleted العام (يلي ممكن يكون تاريخ فرصة فردية ما علاقة
  // إلها بإنجاز الأنشطة الجماعية أصلًا)
  const earliestCompletedGroup = [...completedGroup].sort(
    (a, b) => new Date(a.joinedDate) - new Date(b.joinedDate),
  )[0]

  const unlockedMap = {
    a1: completedOpportunitiesCount >= 1,
    a2: totalConfirmedHours >= 10,
    a3: completedGroupOpportunitiesCount >= 3,
  }

  const earnedDateMap = {
    a1: earliestCompleted?.joinedDate || null,
    a2: earliestCompleted?.joinedDate || null,
    a3: earliestCompletedGroup?.joinedDate || null,
  }

  // تقدّم كل إنجاز نحو هدفه (current/target) — تُستخدم فقط لعرض شريط
  // تقدّم بصري بالواجهة، القيمة الحقيقية للفتح تبقى unlockedMap فوق
  const progressMap = {
    a1: { current: Math.min(completedOpportunitiesCount, 1), target: 1 },
    a2: { current: Math.min(totalConfirmedHours, 10), target: 10 },
    a3: { current: Math.min(completedGroupOpportunitiesCount, 3), target: 3 },
  }

  return ACHIEVEMENT_DEFINITIONS.map((definition) => ({
    ...definition,
    unlocked: unlockedMap[definition.id] || false,
    earnedDate: unlockedMap[definition.id] ? earnedDateMap[definition.id] || null : null,
    progress: progressMap[definition.id] || null,
  }))
}

/**
 * يحسب حالة فتح كل إنجاز لمتطوع معيّن، من سجل مشاركاته الحقيقي عبر
 * المنصة كلها (مش خاص بمنظمة وحدة — راجع API_CONTRACT.md لتوضيح ليش
 * قواعد المنح تراكمية عالمنصة، مش قابلة للعزل حسب منظمة بعينها).
 * @param {string} volunteerId
 */
function computeAchievementsForVolunteer(volunteerId) {
  // نبني نفس شكل fetchMyParticipations بالضبط (opportunity كاملة مرفقة
  // بحالتها الفعلية) حتى نقدر نمرّرها لنفس الدالة الموحّدة
  // buildVolunteerHoursSummary المستخدمة بملخّص بروفايل المتطوع وبإحصائيات
  // "لدى هالمنظمة" بـ participations.js — صفر تكرار لمنطق حساب الساعات
  const myParticipations = MOCK_PARTICIPATIONS.filter((p) => p.volunteerId === volunteerId).map(
    (participation) => {
      const opportunity = MOCK_OPPORTUNITIES.find((item) => item.id === participation.opportunityId) || null
      return {
        ...participation,
        opportunity: opportunity ? { ...opportunity, status: getEffectiveOpportunityStatus(opportunity) } : null,
      }
    },
  )

  return computeAchievementsFromParticipations(myParticipations)
}

/**
 * Fetches the FULL achievement catalog for a volunteer, each entry flagged
 * with whether it's unlocked yet (so locked ones can still be displayed).
 * @param {string|number} [volunteerId] - Volunteer id (optional when using token-based "me" auth)
 * @returns {Promise<Array<{id:string, name:string, description:string, unlocked:boolean, earnedDate:string|null, progress:{current:number, target:number}|null}>>}
 */
export async function fetchVolunteerAchievements(volunteerId) {
  if (MOCK_MODE) {
    await wait()

    // لو ما انمرر volunteerId (حالة "me" — صفحة بروفايل المتطوع نفسه)،
    // منحله من الجلسة الحالية بنفس منطق participateInOpportunity بالضبط
    const resolvedId = volunteerId || (() => {
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY)
        const email = raw ? JSON.parse(raw)?.user?.email : null
        return email ? `v-${email}` : null
      } catch {
        return null
      }
    })()

    if (!resolvedId) {
      return ACHIEVEMENT_DEFINITIONS.map((definition) => ({
        ...definition,
        unlocked: false,
        earnedDate: null,
        progress: null,
      }))
    }

    return computeAchievementsForVolunteer(resolvedId)
  }

  try {
    const endpoint = volunteerId
      ? `/volunteers/${volunteerId}/achievements`
      : '/volunteers/me/achievements'

    const response = await apiClient.get(endpoint)
    return response.data || []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load achievements'))
  }
}