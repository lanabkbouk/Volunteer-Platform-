// services/notifications.js
//
// نظام التنبيهات — تمت الموافقة عليه من الباك اند، لكن الـ endpoint
// الحقيقي لسا ما بُني (سيُطوَّر لاحقًا ويُبلَّغ الفرونت). هالملف جاهز
// من الآن بنفس بنية باقي الخدمات (MOCK_MODE / real API) حتى لما يجهز
// الـ endpoint، الاستبدال يصير هون فقط بدون أي لمسة على useRecentUpdates
// أو NotificationBell أو أي Component تاني.
//
// TODO: لما يجهز الباك اند، الشكل المتوقع للـ endpoint:
//   GET /api/notifications
//   Response: [{ id, type, title, description, href, seen }, ...]
// أو أي شكل تاني يتفقوا عليه — المهم إنه يترجم هون فقط لنفس شكل items[]
// المستخدم حاليًا (id/type/title/description/href) دون تغيير أي مكان تاني.

import { apiClient, getApiErrorMessage } from './api/client'
import { isMockMode } from './api/mockMode'
import { fetchVolunteerAchievements } from './achievements'
import { fetchMyParticipations, fetchApplicantsForOpportunity } from './participations'
import { fetchOrganizationProfile } from './organization'
import { fetchMyOpportunities } from './opportunities'
import { getSeenAchievementIds, markAchievementIdsSeen } from '../utils/achievementSeenTracker'
import { getSeenHoursMap, markHoursSeen } from '../utils/hoursSeenTracker'
import { getSeenStatusMap, markStatusSeen } from '../utils/participationStatusSeenTracker'
import { getSeenOrganizationStatusMap, markOrganizationStatusSeen } from '../utils/organizationVerificationSeenTracker'
import { getSeenApplicantStatusMap, markApplicantStatusSeen } from '../utils/organizationApplicantSeenTracker'
import { PARTICIPATION_STATUS } from '../constants/participationStatus'
import { ORGANIZATION_STATUS } from '../constants/organizationStatus'
import { ACCOUNT_TYPES } from '../constants/auth/accountTypes'
import { ROUTES } from '../constants/paths'
import { getDaysUntilStart } from '../utils/opportunityStatus'

const MOCK_MODE = isMockMode()

// يبني عناصر التنبيهات من الإنجازات: كل إنجاز اتفتح حديثًا ولسا ما
// انشاف (مش موجود بقائمة seenAchievements) بيصير عنصر تنبيه واحد
function buildAchievementItems(achievements, seenAchievements) {
  return achievements
    .filter((achievement) => achievement.unlocked && !seenAchievements.has(achievement.id))
    .map((achievement) => ({
      id: `achievement:${achievement.id}`,
      type: 'achievement',
      title: 'New achievement unlocked',
      description: achievement.name,
      // ينقل مباشرة لصفحة My Journey (pages/volunteerJourney.jsx) — الإنجازات
      // صارت قسم فيها بدل صفحة مستقلة
      href: ROUTES.MY_JOURNEY,
      // تعليم صريح كـ"مقروء" (من الـ Bell أو صفحة /notifications) —
      // بيدمج مع أي إنجازات اتعلّمت مسبقًا بدل ما يفقدها (markAchievementIdsSeen
      // بتكتب الـ Set كاملة، مش عنصر واحد)
      onDismiss: () => markAchievementIdsSeen(new Set([...seenAchievements, achievement.id])),
    }))
}

// يبني عناصر التنبيهات من المشاركات: ساعات اتأكدت حديثًا، أو حالة
// المشاركة اتغيّرت (قُبل/اترفض) ولسا ما انشافت
function buildParticipationItems(participations, seenHours, seenStatus) {
  const items = []

  participations.forEach((participation) => {
    const opportunityTitle = participation.opportunity?.title || 'an opportunity'

    const hasNewHours =
      participation.hoursLogged !== null &&
      participation.hoursLogged !== undefined &&
      Number(seenHours.get(participation.id)) !== Number(participation.hoursLogged)

    if (hasNewHours) {
      items.push({
        id: `hours:${participation.id}`,
        type: 'hours',
        title: 'Hours confirmed',
        description: `${opportunityTitle}: ${participation.hoursLogged} hrs`,
        href: ROUTES.MY_VOLUNTEERING,
        onDismiss: () => markHoursSeen(participation.id, participation.hoursLogged),
      })
    }

    const isDecided =
      participation.status === PARTICIPATION_STATUS.ACCEPTED ||
      participation.status === PARTICIPATION_STATUS.REJECTED

    if (isDecided && seenStatus.get(participation.id) !== participation.status) {
      items.push({
        id: `status:${participation.id}`,
        type:
          participation.status === PARTICIPATION_STATUS.ACCEPTED
            ? 'status-accepted'
            : 'status-rejected',
        title:
          participation.status === PARTICIPATION_STATUS.ACCEPTED
            ? 'Your request was accepted'
            : 'Your request was declined',
        description: opportunityTitle,
        href: ROUTES.MY_VOLUNTEERING,
        onDismiss: () => markStatusSeen(participation.id, participation.status),
      })
    }
  })

  return items
}

// يبني عنصر تنبيه واحد من قرار توثيق الأدمن (قبول/رفض) على المنظمة —
// بس لو القرار "جديد" (مختلف عن آخر status شافته المنظمة، راجع
// organizationVerificationSeenTracker.js). حالة "pending" مش قرار
// بحد ذاتها (لا قبول ولا رفض)، فما بتولّد أي تنبيه
function buildOrganizationVerificationItems(organization, seenStatus) {
  if (!organization) return []

  const isDecided =
    organization.status === ORGANIZATION_STATUS.VERIFIED ||
    organization.status === ORGANIZATION_STATUS.REJECTED

  if (!isDecided || seenStatus.get(String(organization.id)) === organization.status) return []

  const isVerified = organization.status === ORGANIZATION_STATUS.VERIFIED

  return [
    {
      id: `org-verification:${organization.id}:${organization.status}`,
      type: isVerified ? 'org-verified' : 'org-rejected',
      title: isVerified ? 'Your organization has been verified' : 'Verification request rejected',
      description: isVerified
        ? 'You can now post opportunities and use all organization features.'
        : organization.rejectionReason || 'Upload a new verification document to request another review.',
      href: ROUTES.ORGANIZATION_PROFILE,
      onDismiss: () => markOrganizationStatusSeen(organization.id, organization.status),
    },
  ]
}

// يبني تذكيرًا لكل مشاركة "مقبولة" وتاريخ بدء فرصتها ضمن نافذة
// "قريبًا" (يومين) — حساب النافذة نفسه مفوَّض بالكامل لـ
// getDaysUntilStart (utils/opportunityStatus.js)، نفس الدالة
// المستخدمة بالضبط بـ ParticipationCard.jsx لعرض شارة مطابقة على
// البطاقة. من نفس بيانات المشاركات المجلوبة أصلاً لباقي التنبيهات
// بالأسفل، بدون أي جلب إضافي أو Cron/جدولة خلفية (النظام أصلاً محسوب
// لحظة تحميل الصفحة، راجع تعليق أعلى الملف). بدون seen-tracker مقصود:
// هذا تذكير زمني بيختفي لحاله أول ما الفرصة تبلّش (مش "خبر" يحتاج
// يُعلَّم كمقروء ويضل مخفي بعدها)
function buildUpcomingOpportunityReminderItems(participations) {
  return participations
    .filter(
      (participation) =>
        participation.status === PARTICIPATION_STATUS.ACCEPTED &&
        getDaysUntilStart(participation.opportunity?.startDate) !== null,
    )
    .map((participation) => ({
      id: `reminder:${participation.id}`,
      type: 'opportunity-reminder',
      title: 'Upcoming opportunity',
      description: `"${participation.opportunity?.title || 'Your opportunity'}" starts soon — don't miss it.`,
      href: ROUTES.MY_VOLUNTEERING,
    }))
}

// يبني عناصر تنبيه من نشاط المتقدّمين على فرص المنظمة — نوعين:
// (1) "انضمام جديد": مشاركة pending لسا ما انشافتها المنظمة (متطوع
//     جديد تقدّم على فرصة)
// (2) "انسحاب": مشاركة withdrawn لسا ما انشافتها المنظمة
// كلا النوعين بيعتمدوا على نفس آلية "آخر status انشافته المنظمة"
// (organizationApplicantSeenTracker.js)، وبيشتركوا بنفس جلب الفرص
// والمتقدّمين — دالة واحدة بدل دالتين متطابقتين تقريبًا، تفاديًا لتكرار
// نفس طلبات الـ API مرتين لكل تحميل تنبيهات
async function buildApplicantActivityItems(seenApplicantStatus) {
  const opportunities = await fetchMyOpportunities()

  const applicantsPerOpportunity = await Promise.all(
    opportunities.map((opportunity) =>
      fetchApplicantsForOpportunity(opportunity.id).then((applicants) => ({ opportunity, applicants })),
    ),
  )

  const items = []

  applicantsPerOpportunity.forEach(({ opportunity, applicants }) => {
    applicants.forEach((applicant) => {
      const isNewToOrganization = seenApplicantStatus.get(String(applicant.id)) !== applicant.status
      if (!isNewToOrganization) return

      const volunteerName = applicant.volunteer?.name || 'A volunteer'
      const dismiss = () => markApplicantStatusSeen(applicant.id, applicant.status)

      if (applicant.status === PARTICIPATION_STATUS.PENDING) {
        items.push({
          id: `new-applicant:${applicant.id}`,
          type: 'applicant-new',
          title: 'New volunteer application',
          description: `${volunteerName} applied to "${opportunity.title}"`,
          href: `${ROUTES.APPLICANTS}/${opportunity.id}`,
          onDismiss: dismiss,
        })
      } else if (applicant.status === PARTICIPATION_STATUS.WITHDRAWN) {
        items.push({
          id: `withdrawal:${applicant.id}`,
          type: 'applicant-withdrawn',
          title: 'A volunteer withdrew',
          description: `${volunteerName} withdrew from "${opportunity.title}"`,
          href: `${ROUTES.APPLICANTS}/${opportunity.id}`,
          onDismiss: dismiss,
        })
      }
    })
  })

  return items
}

/**
 * يجلب التنبيهات الحديثة غير المقروءة للحساب الحالي — متطوع أو منظمة.
 *
 * بوضع Mock: تُشتق من الإنجازات + المشاركات (للمتطوع) أو من قرار توثيق
 * الأدمن + انسحاب متطوعين من فرصها (للمنظمة)، مقارنة بما هو مخزّن
 * محليًا كـ"مشاهَد".
 *
 * @param {{accountType?: string, organizationId?: string|number}} [context]
 * @returns {Promise<Array<{id:string, type:string, title:string, description:string, href:string, seen:boolean}>>}
 */
export async function fetchRecentNotifications({ accountType, organizationId } = {}) {
  // مسار المنظمة منفصل تمامًا: fetchOrganizationProfile أصلًا بتتعامل
  // مع mock/real داخليًا (راجع services/organization.js)، فما في داعي
  // نكرر فرع MOCK_MODE هون كمان
  if (accountType === ACCOUNT_TYPES.ORGANIZATION) {
    if (!organizationId) return []

    const profileResult = await fetchOrganizationProfile(organizationId)
    const verificationItems = profileResult.success
      ? buildOrganizationVerificationItems(profileResult.data, getSeenOrganizationStatusMap())
      : []

    // نشاط المتقدّمين (انضمام جديد/انسحاب) متاح فقط لمنظمة موثّقة فعليًا
    // (غير موثّقة أصلًا ما إلها فرص منشورة أو متقدّمين حقيقيين)
    const applicantActivityItems =
      profileResult.success && profileResult.data?.status === ORGANIZATION_STATUS.VERIFIED
        ? await buildApplicantActivityItems(getSeenApplicantStatusMap())
        : []

    return [...verificationItems, ...applicantActivityItems]
  }

  if (MOCK_MODE) {
    const [achievements, participations] = await Promise.all([
      fetchVolunteerAchievements(),
      fetchMyParticipations(),
    ])

    const achievementItems = buildAchievementItems(achievements, getSeenAchievementIds())
    const participationItems = buildParticipationItems(
      participations,
      getSeenHoursMap(),
      getSeenStatusMap(),
    )
    const reminderItems = buildUpcomingOpportunityReminderItems(participations)

    return [...achievementItems, ...participationItems, ...reminderItems]
  }

  try {
    const response = await apiClient.get('/notifications')
    const data = Array.isArray(response.data) ? response.data : []

    // تطبيع دفاعي: لو الباك اند رجّع أسماء حقول مختلفة شوي عن المتوقع،
    // هالسطر بيضمن إنه NotificationBell ما ينكسر لحد ما يتفق الفريقين
    // نهائيًا على الشكل النهائي للـ endpoint
    return data.map((item) => ({
      id: item.id,
      type: item.type || 'update',
      title: item.title || 'New update',
      description: item.description || item.message || '',
      href: item.href || item.link || ROUTES.HOME,
      seen: Boolean(item.seen),
      onDismiss: () => apiClient.post(`/notifications/${item.id}/read`),
    }))
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load notifications'), { cause: error })
  }
}