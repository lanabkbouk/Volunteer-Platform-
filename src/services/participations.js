// Matches the "participates" relation in the ERD (volunteer <-> opportunity).
// Returns the opportunities the currently logged-in volunteer has joined,
// each enriched with participation-specific fields (status, hours logged).
//
// TODO: once Laravel is ready, set VITE_API_MODE=real
// GET /api/volunteers/me/participations
// Expected response: [{ opportunityId, status, hoursLogged, joinedDate, opportunity }, ...]

import { apiClient, getApiErrorMessage } from './api/client'
import { isMockMode } from './api/mockMode'
import { wait } from './api/delay'
import { fetchOpportunities } from './opportunities'
import { getEffectiveParticipationStatus, PARTICIPATION_STATUS } from '../constants/participationStatus'
import { MOCK_PARTICIPATIONS, MOCK_VOLUNTEER_PROFILES } from './mock/mockParticipationsStore'
import { fetchVolunteerAchievements } from './achievements'
import { buildVolunteerHoursSummary } from '../utils/volunteerHoursSummary'
import { extractPhotoUrl } from '../utils/extractPhotoUrl'
// ✅ بدون خطر Circular Import: participationPolicy.js يعتمد بس على
// constants/participationStatus وutils/opportunityStatus وutils/participationDisplayStatus
// (كلها utils/constants صرفة، ولا وحدة منهم بترجع تستورد من services)،
// فاستيرادها هون آمن 100%. attachComputedStatus نفسها غير مُصدَّرة من
// opportunities.js عمدًا (Internal helper) — بدل ما نعيد كتابة نفس
// منطقها هون أو نصدّرها لغرض واحد، منستخدم fetchOpportunities()
// المستوردة أصلًا فوق، لأنها بترجّع الفرص وهي مطبَّق عليها
// attachComputedStatus داخليًا أصلًا (راجع fetchOpportunities بالأعلى)
import { canWithdraw } from '../utils/participationPolicy'

const MOCK_MODE = isMockMode()

/**
 * Fetches the current volunteer's participations (joined opportunities).
 * @returns {Promise<Array<{opportunityId:string, status:string, hoursLogged:number, joinedDate:string, opportunity:object,
 *   rejectionReason?:string, withdrawnDate?:string, canWithdraw?:boolean}>>}
 *   rejectionReason/withdrawnDate/canWithdraw هي حقول اختيارية — الباك اند
 *   الحقيقي متوقّع يرجّعها بنفس التسمية (camelCase) لما تكون موجودة
 *   (rejectionReason فقط لما status==='rejected'، withdrawnDate فقط لما
 *   status==='withdrawn')، وإلا الواجهة برجع لحسابها محليًا (راجع
 *   utils/participationPolicy.js لـ canWithdraw)
 */
export async function fetchMyParticipations() {
  if (MOCK_MODE) {
    await wait()
    const opportunities = await fetchOpportunities()
    return MOCK_PARTICIPATIONS.map((participation) => {
      const opportunity = opportunities.find((item) => item.id === participation.opportunityId) || null
      return {
        ...participation,
        // pending تتحول expired بالعرض تلقائيًا لو فات تاريخ بداية
        // الفرصة والمنظمة ما ردّت — راجع constants/participationStatus.js
        status: opportunity ? getEffectiveParticipationStatus(participation, opportunity) : participation.status,
        opportunity,
      }
    }).filter((participation) => participation.opportunity)
  }

  try {
    const response = await apiClient.get('/volunteers/me/participations')
    return response.data || []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load your volunteering history'))
  }
}

/**
 * يجلب المتقدمين على فرصة معيّنة (لصفحة "قائمة المتقدمين" عند المنظمة).
 * @param {string} opportunityId
 */
export async function fetchApplicantsForOpportunity(opportunityId) {
  if (MOCK_MODE) {
    await wait()
    // محتاجين تاريخ بداية الفرصة لحساب Expired، وهوية المنظمة لحساب
    // إحصائيات "لدى هالمنظمة بالذات" — نفس منطق fetchMyParticipations
    // بالضبط، بس هون من جهة المنظمة
    const opportunities = await fetchOpportunities()
    const opportunity = opportunities.find((item) => item.id === opportunityId) || null
    const organizationId = opportunity?.organization?.id

    const applicants = MOCK_PARTICIPATIONS.filter(
      (participation) => participation.opportunityId === opportunityId,
    )

    return Promise.all(
      applicants.map(async (participation) => {
        const volunteerProfile = MOCK_VOLUNTEER_PROFILES[participation.volunteerId] || null

        let completedOpportunitiesCount = 0
        let totalHoursVolunteered = 0
        let achievements = []

        // ⚠️ إحصائيات حقيقية محسوبة "لدى هالمنظمة بالذات" — مش رقم
        // ثابت مخترع. بنبني قائمة مشاركات المتطوع كلها (كل المنظمات)
        // بنفس شكل fetchMyParticipations (opportunity كاملة مرفقة)،
        // ونمرّرها لـ buildVolunteerHoursSummary — نفس الدالة الموحّدة
        // المستخدمة بالضبط بملخّص بروفايل المتطوع وبـ achievements.js،
        // وناخد منها بس سطر المنظمة الحالية (organizationId)
        if (volunteerProfile && organizationId) {
          const enrichedParticipations = MOCK_PARTICIPATIONS.filter(
            (item) => item.volunteerId === participation.volunteerId,
          ).map((item) => ({
            ...item,
            opportunity: opportunities.find((o) => o.id === item.opportunityId) || null,
          }))

          const hoursSummary = buildVolunteerHoursSummary(enrichedParticipations)
          const orgEntry = hoursSummary.byOrganization.find(
            (entry) => entry.organizationId === organizationId,
          )

          completedOpportunitiesCount = orgEntry?.completedOpportunitiesCount || 0
          totalHoursVolunteered = orgEntry?.confirmedHours || 0

          // ⚠️ الإنجازات عكس الإحصائيات فوق — تراكمية عبر المنصة كلها
          // (مش قابلة للعزل حسب منظمة، راجع API_CONTRACT.md)، فهون
          // بنجيب القائمة الحقيقية الكاملة لهالمتطوع بغض النظر عن
          // المنظمة الحالية
          achievements = await fetchVolunteerAchievements(participation.volunteerId)
        }

        return {
          id: participation.id,
          // ⚠️ بدون هالسطر، طلب pending كان بيضل "Pending" للأبد حتى لو
          // الفرصة خلصت من زمان — وبالتالي أزرار Accept/Reject تضل ظاهرة
          // بشكل خاطئ عند المنظمة رغم إنه فات وقت القرار
          status: opportunity
            ? getEffectiveParticipationStatus(participation, opportunity)
            : participation.status,
          participatedAt: participation.joinedDate,
          committedHours: participation.committedHours,
          hoursLogged: participation.hoursLogged,
          volunteer: volunteerProfile
            ? {
                ...volunteerProfile,
                // نفس المعالجة الدفاعية المستخدمة بـ normalizeUser.js —
                // راجعي utils/extractPhotoUrl.js. هون بمنطق mock دايمًا
                // null فبيضل '', بس نطبّقها بنفس الشكل زي الفرع الحقيقي
                // تحت حتى ما يفترق سلوك الحقلين بين الوضعين
                photo: extractPhotoUrl(volunteerProfile.photo),
                completedOpportunitiesCount,
                totalHoursVolunteered,
                achievements,
              }
            : null,
        }
      }),
    )
  }

  try {
    const response = await apiClient.get(`/opportunities/${opportunityId}/participants`)
    const applicants = response.data || []
    // نفس باگ VolunteerResource.php الموثّق بـ utils/extractPhotoUrl.js
    // (كائن Media خام بدل رابط نصي) بيصيب صورة المتقدّم هون بالضبط متل
    // ما بيصيب صورة المستخدم الحالي — لازم نفس المعالجة الدفاعية، وإلا
    // Avatar.jsx بينكسر فعليًا (src.startsWith is not a function) لما
    // الوضع الحقيقي يشتغل
    return applicants.map((applicant) => ({
      ...applicant,
      volunteer: applicant.volunteer
        ? { ...applicant.volunteer, photo: extractPhotoUrl(applicant.volunteer.photo) }
        : applicant.volunteer,
    }))
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load applicants'))
  }
}

/**
 * نقطة موحّدة لتغيير حالة طلب مشاركة — تُستخدم من طرف المنظمة (accepted/rejected).
 * @param {string} participationId
 * @param {string} status
 * @param {string} [reason] - سبب الرفض (إلزامي بالواجهة عبر RejectionReasonModal
 *   لما status === 'rejected'، راجع ApplicantCard.jsx). يُخزَّن كـ
 *   participation.rejectionReason، وهو الحقل يلي ParticipationCard.jsx
 *   بجهة المتطوع بتعرضه أصلًا (راجع fetchMyParticipations أعلى الملف)
 */
export async function updateParticipationStatus(participationId, status, reason) {
  if (MOCK_MODE) {
    await wait()
    const participation = MOCK_PARTICIPATIONS.find((item) => item.id === participationId)
    if (participation) {
      participation.status = status
      // السبب بس بيتخزّن لما القرار فعليًا رفض — قبول ما إله سبب
      if (status === PARTICIPATION_STATUS.REJECTED) participation.rejectionReason = reason
    }
    return { success: true }
  }

  try {
    await apiClient.put(`/participations/${participationId}`, { status, rejection_reason: reason })
    return { success: true }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to update this request') }
  }
}

// انسحاب المتطوع من مشاركة — قرار مُحدَّث مع فريق: بدل الحذف
// الكامل (كان يعني اختفاء المتطوع من قائمة المتقدمين عند المنظمة
// بصمت تام، بدون أي تفسير)، المشاركة تبقى بالسجل بحالة WITHDRAWN
// صريحة — متاح من pending أو accepted سوا، بأي وقت. راجع
// constants/participationStatus.js للفرق بين WITHDRAWN وREJECTED.
/**
 * @param {string} participationId
 */
export async function withdrawParticipation(participationId) {
  if (MOCK_MODE) {
    await wait()
    const participation = MOCK_PARTICIPATIONS.find((item) => item.id === participationId)
    if (!participation) return { success: false, error: 'Participation not found' }

    // محاكاة للتحقق يلي لازم الباك اند الحقيقي يفرضه هو كمان (نفس نمط
    // فحص minHours/maxHours بـ participateInOpportunity بأعلى الملف
    // المجاور) — تعطيل زر الانسحاب بالواجهة (ParticipationCard عبر
    // canWithdraw()) خط دفاع أول بس، مش كافي وحده: استدعاء مباشر لهاي
    // الدالة، أو حالة واجهة قديمة/غير محدّثة، ممكن يحاول "سحب" مشاركة
    // خلص القرار فيها فعليًا (accepted بعد ما قفل التسجيل، أو
    // rejected/withdrawn أصلًا). نفس canWithdraw() المستخدمة بالضبط
    // بـ ParticipationCard، حتى القاعدة ما تنحرف بمكانين
    const opportunities = await fetchOpportunities()
    const opportunity = opportunities.find((item) => item.id === participation.opportunityId) || null
    if (!canWithdraw({ ...participation, opportunity })) {
      return { success: false, error: 'This participation can no longer be withdrawn' }
    }

    participation.status = PARTICIPATION_STATUS.WITHDRAWN
    participation.withdrawnDate = new Date().toISOString().slice(0, 10)
    return { success: true }
  }

  try {
    await apiClient.put(`/participations/${participationId}`, { status: PARTICIPATION_STATUS.WITHDRAWN })
    return { success: true }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to withdraw from this opportunity') }
  }
}

// ————————————————————————————————————————————————————————————
// إدارة الساعات النهائية (منظمة فقط، بعد انتهاء الفرصة) — راجع
// ManageHoursModal.jsx وApplicantCard.jsx. الشرط (opportunityHasEnded
// && isAccepted) محسوب بالكامل بالفرونت أصلاً؛ هالدالة نفّذت هون
// كنقطة واحدة، لكنها لن تُستخدم فعليًا بوضع real لحد ما فريق  يضيف:
//   - عمود hours_logged (nullable) بجدول opportunity_volunteer
//   - PATCH /participations/{id}/hours { hours }
// ————————————————————————————————————————————————————————————

/**
 * تحدّث الساعات النهائية المؤكدة لمشاركة معيّنة (بعد انتهاء الفرصة).
 * نفس نمط {success,error} المستخدم بـ updateParticipationStatus.
 * @param {string} participationId
 * @param {number} hours
 */
export async function updateParticipationHours(participationId, hours) {
  if (MOCK_MODE) {
    await wait()

    const participation = MOCK_PARTICIPATIONS.find((item) => item.id === participationId)
    if (!participation) return { success: false, error: 'Participation not found' }

    participation.hoursLogged = hours
    return { success: true }
  }

  try {
    await apiClient.patch(`/participations/${participationId}/hours`, { hours })
    return { success: true }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to update hours') }
  }
}