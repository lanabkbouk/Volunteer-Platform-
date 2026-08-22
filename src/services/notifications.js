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
import { fetchPendingOrganizations } from './admin'
import {
  getSeenAchievementNotificationIds,
  markAchievementNotificationIdsSeen,
} from '../utils/achievementNotificationSeenTracker'
import { getSeenHoursMap, markHoursSeen } from '../utils/hoursSeenTracker'
import { getSeenStatusMap, markStatusSeen } from '../utils/participationStatusSeenTracker'
import { getSeenOrganizationStatusMap, markOrganizationStatusSeen } from '../utils/organizationVerificationSeenTracker'
import { getSeenApplicantStatusMap, markApplicantStatusSeen } from '../utils/organizationApplicantSeenTracker'
import { getSeenPendingOrganizationIds, markPendingOrganizationSeen } from '../utils/pendingOrganizationSeenTracker'
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
      // بيدمج مع أي إنجازات اتعلّمت مسبقًا بدل ما يفقدها
      // (markAchievementNotificationIdsSeen بتكتب الـ Set كاملة، مش عنصر
      // واحد). تراكر مستقل تمامًا عن مودال الاحتفال بصفحة My Journey —
      // راجع achievementNotificationSeenTracker.js
      onDismiss: () => markAchievementNotificationIdsSeen(new Set([...seenAchievements, achievement.id])),
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

// يبني عناصر تنبيه من المنظمات المعلّقة (Pending) لسا ما "انشافت" من
// الأدمن — نفس فلسفة seen-tracking المستخدمة لباقي أنواع التنبيهات
// (إنجازات، حالة مشاركة...)، هون خاص بمعرّف كل منظمة على حدة (id→seen)
// لأن أكتر من منظمة ممكن تكون معلّقة بنفس الوقت
function buildPendingOrganizationItems(pendingOrganizations, seenOrgIds) {
  return pendingOrganizations
    .filter((organization) => !seenOrgIds.has(String(organization.id)))
    .map((organization) => ({
      id: `pending-org:${organization.id}`,
      type: 'pending_organization',
      title: 'New organization awaiting verification',
      description: organization.name || 'Untitled organization',
      href: ROUTES.ADMIN_ORGANIZATIONS,
      onDismiss: () =>
        markPendingOrganizationSeen(
          organization.id,
          new Set([...seenOrgIds, String(organization.id)]),
        ),
    }))
}

/**
 * يجلب التنبيهات الحديثة غير المقروءة للحساب الحالي — متطوع أو منظمة.
 *
 * بوضع Mock: تُشتق من الإنجازات + المشاركات (للمتطوع) أو من قرار توثيق
 * الأدمن + انسحاب متطوعين من فرصها (للمنظمة)، مقارنة بما هو مخزّن
 * محليًا كـ"مشاهَد".
 *
 * @param {{accountType?: string, organizationId?: string|number}} [context]
 * @returns {Promise<Array<{id:string, type:string, title:string, description:string, href:string}>>}
 */
export async function fetchRecentNotifications({ accountType, organizationId } = {}) {
  // مسار المنظمة منفصل تمامًا: fetchOrganizationProfile أصلًا بتتعامل
  // مع mock/real داخليًا (راجع services/organization.js)، فما في داعي
  // نكرر فرع MOCK_MODE هون كمان
  if (accountType === ACCOUNT_TYPES.ORGANIZATION) {
    if (!organizationId) return []

    // fetchOrganizationProfile هلق بترمي (throw) عند الفشل بدل ما ترجع
    // {success,error} (راجع services/organization.js) — بنلقطها هون
    // ونرجّع قائمة فاضية بنفس سلوك الفرع القديم (فشل تحميل البروفايل
    // ما لازم يكسر جرس الإشعارات كله، بس يعني "ولا عنصر جديد هلق")
    let profile
    try {
      profile = await fetchOrganizationProfile(organizationId)
    } catch {
      return []
    }

    const verificationItems = buildOrganizationVerificationItems(profile, getSeenOrganizationStatusMap())

    // نشاط المتقدّمين (انضمام جديد/انسحاب) متاح فقط لمنظمة موثّقة فعليًا
    // (غير موثّقة أصلًا ما إلها فرص منشورة أو متقدّمين حقيقيين)
    const applicantActivityItems =
      profile?.status === ORGANIZATION_STATUS.VERIFIED
        ? await buildApplicantActivityItems(getSeenApplicantStatusMap())
        : []

    return [...verificationItems, ...applicantActivityItems]
  }

  // مسار الأدمن: منظمات pending فقط — fetchPendingOrganizations أصلًا
  // بتتعامل مع mock/real داخليًا (راجع services/admin.js)، فما في داعي
  // نكرر فرع MOCK_MODE هون كمان، نفس منطق مسار المنظمة فوق بالضبط
  if (accountType === ACCOUNT_TYPES.ADMIN) {
    const pendingOrganizations = await fetchPendingOrganizations()
    return buildPendingOrganizationItems(pendingOrganizations, getSeenPendingOrganizationIds())
  }

  if (MOCK_MODE) {
    const [achievements, participations] = await Promise.all([
      fetchVolunteerAchievements(),
      fetchMyParticipations(),
    ])

    const achievementItems = buildAchievementItems(achievements, getSeenAchievementNotificationIds())
    const participationItems = buildParticipationItems(
      participations,
      getSeenHoursMap(),
      getSeenStatusMap(),
    )
    const reminderItems = buildUpcomingOpportunityReminderItems(participations)

    return [...achievementItems, ...participationItems, ...reminderItems]
  }

  try {
    // نرسل ?unread=true تحسّبًا لدعم الباك اند لها مستقبلًا (فلترة من
    // السيرفر مباشرة أوفر) — نفس نمط fetchOrganizations بـ organizations.js
    // (?status=verified). بغض النظر عن دعم الباك اند لها فعليًا، الفلترة
    // الدفاعية تحت بتضمن دايمًا وصول غير المقروءة فقط
    const response = await apiClient.get('/notifications', { params: { unread: true } })
    const data = Array.isArray(response.data) ? response.data : []

    // فلترة دفاعية: لو الباك اند تجاهل ?unread= فوق (أو لسا ما بيدعمها)
    // ورجّع كل الإشعارات مقروءة وغير مقروءة معًا، هالسطر يضمن إنه العداد
    // وقائمة الـ Bell يعرضوا فقط غير المقروءة — تمامًا متل فرع Mock فوق
    // يلي أصلًا ما بيرجّع إلا العناصر غير "المشاهَدة" (راجع getSeen*Map)
    return data
      .filter((item) => !item.seen)
      .map((item) => ({
        id: item.id,
        type: item.type || 'update',
        title: item.title || 'New update',
        description: item.description || item.message || '',
        href: item.href || item.link || ROUTES.HOME,
        onDismiss: () => apiClient.post(`/notifications/${item.id}/read`),
      }))
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load notifications'), { cause: error })
  }
}