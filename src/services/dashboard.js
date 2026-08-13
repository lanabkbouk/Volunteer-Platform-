// services/dashboard.js
//
// ما في Endpoint واحد جاهز يرجّع "إحصائيات لوحة تحكم المنظمة" مباشرة،
// فهاد الملف يجمّع (يـ Compose) بيانات موجودة أصلاً بخدمتين منفصلتين
// (fetchMyOpportunities + fetchApplicantsForOpportunity لكل فرصة) ويحسب
// منها الإحصائيات والنشاطات الأخيرة — بدل ما هالحسبة تصير جوا الصفحة.
//
// لما يجهز endpoint حقيقي بالباك اند (مثلاً GET /organizations/me/dashboard)
// بيصير التبديل هون بس بمكان واحد، بدون ما تتغيّر صفحة الداشبورد نفسها.

import { fetchMyOpportunities } from './opportunities'
import { fetchApplicantsForOpportunity } from './participations'
import { OPPORTUNITY_STATUS } from '../constants/opportunityStatus'
import { PARTICIPATION_STATUS } from '../constants/participationStatus'

const ANALYTICS_METRICS = [
  { key: 'opportunitiesCreated', label: 'Opportunities created' },
  { key: 'applicationsReceived', label: 'Applications received' },
  { key: 'acceptedVolunteers', label: 'Accepted volunteers' },
  { key: 'totalVolunteerHours', label: 'Total volunteer hours' },
]

function toDateOrNull(value) {
  if (!value) return null

  const dateString = String(value).includes('T') ? String(value) : `${value}T00:00:00`
  const date = new Date(dateString)

  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date) {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function startOfMonth(date) {
  const normalized = new Date(date)
  normalized.setDate(1)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function addMonths(date, amount) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

function formatDayKey(date) {
  return date.toISOString().slice(0, 10)
}

function formatMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function createSeries(periods, keyFormatter, labelFormatter) {
  return periods.map((period) => ({
    key: keyFormatter(period),
    label: labelFormatter(period),
    opportunitiesCreated: 0,
    applicationsReceived: 0,
    acceptedVolunteers: 0,
    totalVolunteerHours: 0,
  }))
}

function getAnalyticsReferenceDate(opportunities, applicantsPerOpportunity) {
  const dates = []

  opportunities.forEach((opportunity) => {
    const createdAt =
      toDateOrNull(opportunity.createdAt) ||
      toDateOrNull(opportunity.created_at) ||
      toDateOrNull(opportunity.publishedAt) ||
      toDateOrNull(opportunity.startDate) ||
      toDateOrNull(opportunity.start_date)

    if (createdAt) dates.push(createdAt)
  })

  applicantsPerOpportunity.flat().forEach((applicant) => {
    const activityDate = toDateOrNull(applicant.participatedAt || applicant.joinedDate || applicant.createdAt)

    if (activityDate) dates.push(activityDate)
  })

  if (dates.length === 0) return new Date()

  return dates.reduce((latest, current) => (current > latest ? current : latest), dates[0])
}

function buildWeeklyAnalytics(opportunities, applicantsPerOpportunity, referenceDate) {
  const weekEnd = startOfDay(referenceDate)
  const weekStart = addDays(weekEnd, -6)
  const series = createSeries(
    Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    formatDayKey,
    (period) => period.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
  )
  const lookup = new Map(series.map((item) => [item.key, item]))

  opportunities.forEach((opportunity) => {
    const createdAt =
      toDateOrNull(opportunity.createdAt) ||
      toDateOrNull(opportunity.created_at) ||
      toDateOrNull(opportunity.publishedAt) ||
      toDateOrNull(opportunity.startDate) ||
      toDateOrNull(opportunity.start_date)

    if (!createdAt) return

    const bucket = lookup.get(formatDayKey(startOfDay(createdAt)))
    if (bucket) bucket.opportunitiesCreated += 1
  })

  applicantsPerOpportunity.flat().forEach((applicant) => {
    const activityDate = toDateOrNull(applicant.participatedAt || applicant.joinedDate || applicant.createdAt)
    if (!activityDate) return

    const bucket = lookup.get(formatDayKey(startOfDay(activityDate)))
    if (!bucket) return

    bucket.applicationsReceived += 1

    if (applicant.status === PARTICIPATION_STATUS.ACCEPTED) {
      bucket.acceptedVolunteers += 1
      bucket.totalVolunteerHours += Number(applicant.hoursLogged ?? applicant.committedHours) || 0
    }
  })

  return series
}

function buildMonthlyAnalytics(opportunities, applicantsPerOpportunity, referenceDate) {
  const monthEnd = startOfMonth(referenceDate)
  const monthStart = addMonths(monthEnd, -5)
  const periods = Array.from({ length: 6 }, (_, index) => addMonths(monthStart, index))
  const series = createSeries(periods, formatMonthKey, (period) =>
    period.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
  )
  const lookup = new Map(series.map((item) => [item.key, item]))

  opportunities.forEach((opportunity) => {
    const createdAt =
      toDateOrNull(opportunity.createdAt) ||
      toDateOrNull(opportunity.created_at) ||
      toDateOrNull(opportunity.publishedAt) ||
      toDateOrNull(opportunity.startDate) ||
      toDateOrNull(opportunity.start_date)

    if (!createdAt) return

    const bucket = lookup.get(formatMonthKey(startOfMonth(createdAt)))
    if (bucket) bucket.opportunitiesCreated += 1
  })

  applicantsPerOpportunity.flat().forEach((applicant) => {
    const activityDate = toDateOrNull(applicant.participatedAt || applicant.joinedDate || applicant.createdAt)
    if (!activityDate) return

    const bucket = lookup.get(formatMonthKey(startOfMonth(activityDate)))
    if (!bucket) return

    bucket.applicationsReceived += 1

    if (applicant.status === PARTICIPATION_STATUS.ACCEPTED) {
      bucket.acceptedVolunteers += 1
      bucket.totalVolunteerHours += Number(applicant.hoursLogged ?? applicant.committedHours) || 0
    }
  })

  return series
}

function buildAnalyticsTrends(opportunities, applicantsPerOpportunity) {
  const referenceDate = getAnalyticsReferenceDate(opportunities, applicantsPerOpportunity)

  return {
    metrics: ANALYTICS_METRICS,
    weekly: buildWeeklyAnalytics(opportunities, applicantsPerOpportunity, referenceDate),
    monthly: buildMonthlyAnalytics(opportunities, applicantsPerOpportunity, referenceDate),
  }
}

/**
 * @typedef {Object} OrganizationDashboardData
 * @property {number} totalOpportunities
 * @property {number} openOpportunities
 * @property {number} totalVolunteers
 * @property {number} pendingRequests
 * @property {number} completionRate - نسبة مئوية (0-100)
 * @property {number} totalHoursPledged - مجموع الساعات الملتزم فيها من كل
 *   المتقدمين (committedHours) على كل فرص المنظمة، بغض النظر عن حالة
 *   الطلب أو انتهاء الفرصة — رقم "الوعد" الكلي، مش الساعات المؤكدة فعليًا
 *   بعد (تلك تُحسب لاحقًا لكل فرصة على حدة بعد انتهائها عبر Manage Hours)
 * @property {Array<{id:string, title:string, currentVolunteers:number, maxVolunteers:number}>} opportunitiesBreakdown
 * @property {Array<{id:string, volunteerName:string, opportunityTitle:string, opportunityId:string, status:string, date:string}>} recentActivity
 * @property {{metrics:Array<{key:string,label:string}>, weekly:Array<object>, monthly:Array<object>}} analyticsTrends
 */

/**
 * يجلب ويجمّع كل بيانات لوحة تحكم المنظمة الحالية.
 * @param {string} organizationId - هوية المنظمة الحالية (من AuthContext)
 * @returns {Promise<{success: boolean, data?: OrganizationDashboardData, error?: string}>}
 */
export async function fetchOrganizationDashboard(organizationId) {
  try {
    const opportunities = await fetchMyOpportunities(organizationId)

    if (opportunities.length === 0) {
      return {
        success: true,
        data: {
          totalOpportunities: 0,
          openOpportunities: 0,
          totalVolunteers: 0,
          pendingRequests: 0,
          completionRate: 0,
          totalHoursPledged: 0,
          opportunitiesBreakdown: [],
          recentActivity: [],
          analyticsTrends: {
            metrics: ANALYTICS_METRICS,
            weekly: [],
            monthly: [],
          },
        },
      }
    }

    // نجيب المتقدّمين لكل فرصة بالتوازي (Promise.all) بدل واحد ورا الثاني
    const applicantsPerOpportunity = await Promise.all(
      opportunities.map((opportunity) => fetchApplicantsForOpportunity(opportunity.id)),
    )

    const totalOpportunities = opportunities.length
    // "مفتوحة" هلق تعني فعليًا registration_open بس (لسا تقبل متطوعين
    // جدد) — قيد العمل ما بتُحسب هون لأنها ما عادت تقبل تسجيل جديد
    const openOpportunities = opportunities.filter(
      (item) => item.status === OPPORTUNITY_STATUS.REGISTRATION_OPEN,
    ).length
    const completedOpportunities = opportunities.filter(
      (item) => item.status === OPPORTUNITY_STATUS.COMPLETED,
    ).length

    const totalVolunteers = opportunities.reduce(
      (sum, item) => sum + (Number(item.currentVolunteers) || 0),
      0,
    )

    const allApplicants = applicantsPerOpportunity.flat()
    const pendingRequests = allApplicants.filter(
      (applicant) => applicant.status === PARTICIPATION_STATUS.PENDING,
    ).length

    // مجموع الساعات الملتزم فيها (committedHours) عبر كل المتقدمين، بغض
    // النظر عن الفرصة — نستثني المرفوضين لأنهم لم يلتزموا فعليًا بشي،
    // وما بنستخدم hoursLogged هون لأنه لسا فاضي (null) لحد ما فرص تخلص
    // وتتأكد المنظمة منها فرصة فرصة (راجع ManageHoursModal)
    const totalHoursPledged = allApplicants
      .filter((applicant) => applicant.status !== PARTICIPATION_STATUS.REJECTED)
      .reduce((sum, applicant) => sum + (Number(applicant.committedHours) || 0), 0)

    // معدل اكتمال الفرص: نسبة الفرص "المنتهية فعليًا" (completed) من
    // إجمالي الفرص المنشورة — بدل نسبة "غير المفتوحة" سابقًا، يلي كانت
    // بتحسب الفرص "قيد العمل" خطأً كـ "منتهية"
    const completionRate = Math.round((completedOpportunities / totalOpportunities) * 100)

    const opportunitiesBreakdown = opportunities.map((opportunity) => ({
      id: opportunity.id,
      title: opportunity.title,
      currentVolunteers: Number(opportunity.currentVolunteers) || 0,
      maxVolunteers: Number(opportunity.maxVolunteers) || 0,
    }))

    // نبني قائمة نشاطات موحّدة — بس الطلبات يلي لسا بانتظار مراجعة المنظمة
    // (PENDING)، مش كل طلب بغض النظر عن حالته — "أحدث النشاطات" بالداشبورد
    // المقصود منها تلفت نظر المنظمة للي محتاج فعل منها فعليًا، مش سجل عام
    // بيتضمّن طلبات مقبولة/مرفوضة خلص انتهى أمرها. الفلترة قبل الـ slice(0,5)
    // (مش بعده) عشان نضمن آخر 5 طلبات pending فعليًا، مش آخر 5 طلبات
    // بأي حالة يصير منها pending بالصدفة أقل من 5
    const recentActivity = opportunities
      .flatMap((opportunity, index) =>
        applicantsPerOpportunity[index]
          .filter((applicant) => applicant.status === PARTICIPATION_STATUS.PENDING)
          .map((applicant) => ({
            id: applicant.id,
            volunteerName: applicant.volunteer?.name || 'A volunteer',
            opportunityTitle: opportunity.title,
            opportunityId: opportunity.id,
            status: applicant.status,
            date: applicant.participatedAt,
          })),
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)

    const analyticsTrends = buildAnalyticsTrends(opportunities, applicantsPerOpportunity)

    return {
      success: true,
      data: {
        totalOpportunities,
        openOpportunities,
        totalVolunteers,
        pendingRequests,
        completionRate,
        totalHoursPledged,
        opportunitiesBreakdown,
        recentActivity,
        analyticsTrends,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Unable to load dashboard data',
    }
  }
}