// utils/volunteerHoursSummary.js
//
// نقطة واحدة لحساب "ساعات التطوع المؤكدة" لمتطوع — بدل ما كل مكان
// بالمشروع (الإنجازات achievements.js، إحصائيات "لدى هالمنظمة" بـ
// participations.js، وقريبًا ملخّص البروفايل) يحسب نفس الشي بمنطقه
// الخاص وبصياغة مختلفة شوي في كل مرة. دالة نقية (Pure) بدون أي استيراد
// من services/*، فما في خطر Circular Import مهما كانت الجهة المستوردة.
//
// قاعدة "مكتملة ومؤكدة" (نفس القاعدة بالضبط بكل مكان بالمشروع):
// participation.status === ACCEPTED && participation.opportunity.status === COMPLETED
// والساعات المحسوبة هي hoursLogged (الرقم الذي أكّدته المنظمة)، مش
// committedHours (رقم الوعد الأولي من المتطوع نفسه).

import { PARTICIPATION_STATUS } from '../constants/participationStatus'
import { OPPORTUNITY_STATUS } from '../constants/opportunityStatus'

/**
 * القاعدة الموحّدة لـ"مشاركة مكتملة ومؤكدة" — مُصدَّرة حتى تُستخدم من
 * أي مكان محتاج نفس الفلترة (مثلًا CompletedOpportunitiesTimeline)
 * بدل ما يعيد كل مكان كتابة نفس الشرط بصياغته الخاصة.
 * @param {{status:string, opportunity:{status:string}|null}} participation
 */
export function isCompletedParticipation(participation) {
  return (
    participation.status === PARTICIPATION_STATUS.ACCEPTED &&
    participation.opportunity?.status === OPPORTUNITY_STATUS.COMPLETED
  )
}

/**
 * @typedef {Object} OrganizationHoursBreakdown
 * @property {string|number} organizationId
 * @property {string} organizationName
 * @property {number} confirmedHours
 * @property {number} completedOpportunitiesCount
 */

/**
 * @typedef {Object} VolunteerHoursSummary
 * @property {number} totalConfirmedHours - مجموع hoursLogged للمشاركات المكتملة والمقبولة فقط
 * @property {number} totalPledgedHours - مجموع committedHours لكل المشاركات غير المرفوضة (رقم الوعد، للمقارنة فقط)
 * @property {number} completedOpportunitiesCount - عدد الفرص المكتملة والمقبولة
 * @property {number} activeOpportunitiesCount - عدد الفرص المقبولة الجارية حاليًا (opportunity.status === in_progress)
 * @property {number} organizationsCount - عدد المنظمات الفريدة التي لدى المتطوع ساعات مؤكدة معها
 * @property {Array<OrganizationHoursBreakdown>} byOrganization - مرتّبة تنازليًا حسب الساعات المؤكدة
 */

/**
 * يبني ملخّص ساعات التطوع من قائمة مشاركات مُجهَّزة (نفس الشكل الذي
 * ترجعه fetchMyParticipations: كل عنصر معه participation.opportunity
 * كاملة، وopportunity.status هي الحالة الفعلية المحسوبة عبر
 * getEffectiveOpportunityStatus وليس قيمة خام مخزّنة).
 *
 * @param {Array<{status:string, hoursLogged:number|null, committedHours:number|null, opportunity:{status:string, organization?:{id:string|number, name:string}}|null}>} participations
 * @returns {VolunteerHoursSummary}
 */
export function buildVolunteerHoursSummary(participations = []) {
  const completed = participations.filter(isCompletedParticipation)

  // "نشطة" = مقبولة والفرصة عم تشتغل هلق فعليًا (in_progress) — حقل
  // إضافي بس، ما بيأثر على totalConfirmedHours/completed فوق لأنه فلترة
  // منفصلة تمامًا (in_progress ≠ completed أصلًا)
  const activeOpportunitiesCount = participations.filter(
    (participation) =>
      participation.status === PARTICIPATION_STATUS.ACCEPTED &&
      participation.opportunity?.status === OPPORTUNITY_STATUS.IN_PROGRESS,
  ).length

  const totalConfirmedHours = completed.reduce(
    (sum, participation) => sum + (Number(participation.hoursLogged) || 0),
    0,
  )

  // الساعات "الملتزَم بها" لازم تستثني كل مين ما عاد ملتزم فعليًا —
  // مش بس المرفوضين (قرار المنظمة)، كمان يلي انسحبوا بأنفسهم
  // (WITHDRAWN)، وإلا وعد شخص انسحب بيضل محسوب بالمجموع بالغلط
  const totalPledgedHours = participations
    .filter(
      (participation) =>
        participation.status !== PARTICIPATION_STATUS.REJECTED &&
        participation.status !== PARTICIPATION_STATUS.WITHDRAWN,
    )
    .reduce((sum, participation) => sum + (Number(participation.committedHours) || 0), 0)

  // تجميع حسب المنظمة (Map للحفاظ على منظمة واحدة = مفتاح واحد بغض
  // النظر عن عدد الفرص المكتملة معها)
  const byOrganizationMap = new Map()

  completed.forEach((participation) => {
    const organization = participation.opportunity?.organization
    if (!organization?.id) return

    const entry = byOrganizationMap.get(organization.id) || {
      organizationId: organization.id,
      organizationName: organization.name || 'Organization',
      confirmedHours: 0,
      completedOpportunitiesCount: 0,
    }

    entry.confirmedHours += Number(participation.hoursLogged) || 0
    entry.completedOpportunitiesCount += 1
    byOrganizationMap.set(organization.id, entry)
  })

  const byOrganization = Array.from(byOrganizationMap.values()).sort(
    (a, b) => b.confirmedHours - a.confirmedHours,
  )

  return {
    totalConfirmedHours,
    totalPledgedHours,
    completedOpportunitiesCount: completed.length,
    activeOpportunitiesCount,
    organizationsCount: byOrganization.length,
    byOrganization,
  }
}