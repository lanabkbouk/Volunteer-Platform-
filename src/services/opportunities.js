// services/opportunities.js
//
// Matches the "opportunity" table in the ERD:
// opp_id, title, description, status, start_date, end_date, location,
// min_hours, max_hours, total_hours, current_volu, max_volu
// + category (via "categorized"), skills (via "requires"),
// + organization (via "publishes").
//
// TODO: once Laravel is ready, set VITE_API_MODE=real
// GET  /api/opportunities            -> list (supports ?search=&categoryId=&skillId=&location=)
// GET  /api/opportunities/{id}       -> single opportunity
// POST /api/opportunities/{id}/participate -> join an opportunity

import { apiClient, getApiErrorMessage } from './api/client'
import { isMockMode } from './api/mockMode'
import { wait } from './api/delay'
import { OPPORTUNITY_STATUS } from '../constants/opportunityStatus'
import { getEffectiveOpportunityStatus, isSuccessfulOpportunity } from '../utils/opportunityStatus'
import { fetchAvailableSkills } from './skills'
import { loadMockUsers } from './mock/mockUserStore'
import { addMockParticipation, MOCK_PARTICIPATIONS } from './mock/mockParticipationsStore'
import { MOCK_OPPORTUNITIES, MOCK_MY_ORGANIZATION_ID } from './mock/mockOpportunitiesStore'
import { AUTH_STORAGE_KEY } from '../constants/auth/storage'
import { normalizeOpportunityOrganization } from '../utils/api/apiResponseSchemas'
import { PARTICIPATION_STATUS } from '../constants/participationStatus'

// إيميل الجلسة الحالية — نفس النمط المستخدم بـ services/organization.js
// وservices/volunteer.js، لازم نعرف مين المتطوع الحالي لحظة الانضمام
// حتى نبني له سجل مشاركة كامل (اسم/مدينة/مهارات) لا رقم مجرّد
function getCurrentSessionEmail() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.user?.email || null
  } catch {
    return null
  }
}

const MOCK_MODE = isMockMode()

// ⚠️ إصلاح جوهري: currentVolunteers ما عاد قيمة مخزّنة بتزيد بس (كانت
// قبل هيك: تزيد بـ participateInOpportunity ولا تنقص أبدًا لا بالانسحاب
// ولا بالرفض — يعني فرصة توصل عددها الكامل وينسحب/يُرفض نصف المتقدمين،
// بتضل registration_closed للأبد رغم وجود مقاعد فاضية فعليًا).
// الحل: نفس فلسفة status المحسوبة بالضبط (getEffectiveOpportunityStatus) —
// currentVolunteers لازم تُحسب لحظيًا من عدد المشاركات الفعلية بدل قيمة
// نخزّنها ونحدّثها يدويًا بكل عملية، فأي انضمام/انسحاب/قبول/رفض ينعكس
// تلقائيًا بدون أي كود إضافي لكل حالة.
//
// ⚠️ عدد المتطوعين الفعلي = accepted فقط. مجرد إرسال طلب انضمام (pending)
// مو مشاركة فعلية بالفرصة، فما بيُحسب. rejected وwithdrawn (حتى لو كان
// متطوع مقبول سابقًا وانسحب) بينقصوا العدد تلقائيًا لأنهم مش accepted.
function computeLiveCurrentVolunteers(opportunityId) {
  return MOCK_PARTICIPATIONS.filter(
    (participation) =>
      participation.opportunityId === opportunityId &&
      participation.status === PARTICIPATION_STATUS.ACCEPTED,
  ).length
}

// يستبدل status المخزّنة بالحالة "الفعلية" المحسوبة لحظيًا (راجع
// utils/opportunityStatus.js) — بهيك أي Component بيقرأ opportunity.status
// بيشوف دايمًا القيمة الصحيحة (تسجيل مفتوح/منتهي/قيد العمل/منتهية) بدون
// أي تعديل إضافي على مكوّنات العرض نفسها
function attachComputedStatus(opportunity) {
  if (!opportunity) return opportunity
  const withLiveCount = {
    ...opportunity,
    currentVolunteers: computeLiveCurrentVolunteers(opportunity.id),
  }
  return { ...withLiveCount, status: getEffectiveOpportunityStatus(withLiveCount) }
}

// يبني FormData لطلب إنشاء/تعديل فرصة، مع إرفاق الصورة إن وُجدت
function buildOpportunityFormData(payload, imageFile) {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value)
  })

  if (imageFile) formData.append('image', imageFile)

  return formData
}

function matchesFilters(opportunity, filters = {}) {
  const {
    search = '',
    categoryId = '',
    categoryIds = [],
    skillId = '',
    skillIds = [],
    location = '',
  } = filters

  const normalizedOpportunity = opportunity || {}
  const opportunityTitle = normalizedOpportunity.title || ''
  const opportunityLocation = normalizedOpportunity.location || ''
  const opportunityCategoryId = normalizedOpportunity.category?.id || ''
  const opportunitySkills = Array.isArray(normalizedOpportunity.skills)
    ? normalizedOpportunity.skills
    : []
  const normalizedCategoryIds = Array.isArray(categoryIds) ? categoryIds.filter(Boolean) : []
  const normalizedSkillIds = Array.isArray(skillIds) ? skillIds.filter(Boolean) : []

  const matchesSearch =
    !search || opportunityTitle.toLowerCase().includes(search.trim().toLowerCase())

  const matchesCategory =
    (!categoryId && normalizedCategoryIds.length === 0) ||
    opportunityCategoryId === categoryId ||
    normalizedCategoryIds.includes(opportunityCategoryId)

  const matchesSkill =
    (!skillId && normalizedSkillIds.length === 0) ||
    opportunitySkills.some((skill) => skill.id === skillId || normalizedSkillIds.includes(skill.id))

  const matchesLocation =
    !location || opportunityLocation.toLowerCase().includes(location.trim().toLowerCase())

  return matchesSearch && matchesCategory && matchesSkill && matchesLocation
}

// ————————————————————————————————————————————————————————————
// خوارزمية "الفرص المقترحة" — نظام نقاط (Matching Score) بدل فلترة
// ثنائية (تظهر/ما تظهر). كل عامل بياخد وزن مختلف، وبنرتّب النتيجة من
// الأعلى تطابقًا للأقل، بدل ما فرصة قريبة جدًا (بس ناقصها شرط واحد)
// تختفي بالكامل وكأنها مش موجودة. الأوزان مبنية على 4 عوامل مبررة
// بمعطيات موجودة أصلًا بالفرونت — صفر حاجة لأي بيانات جديدة من الباك اند
// (لا تتبع تصفح، لا جدول جديد):
//   +3 لكل مهارة مشتركة فعليًا (العامل الأقوى — تطابق مباشر ومباشر)
//   +2 لو نفس مدينة المتطوع
//   +1 لو سبق شارك بتصنيف الفرصة (اهتمام سابق موثّق)
//   +2 إضافية لو سبق اتقبل بنفس التصنيف (نمط نجاح سابق)
//   -1 لو سبق اترفض بنفس التصنيف (إشارة سلبية خفيفة، مش إقصاء كامل)
// ————————————————————————————————————————————————————————————

/**
 * يبني خريطة "سجل التصنيفات" للمتطوع من مشاركاته السابقة — لكل تصنيف:
 * كم مرة شارك فيه، وكم مرة اتقبل/اترفض. مبني بالكامل من بيانات
 * المشاركات الموجودة أصلًا (MOCK_PARTICIPATIONS)، بدون أي مصدر جديد.
 * @returns {Map<string, {total: number, accepted: number, rejected: number}>}
 */
function buildCategoryHistory() {
  const history = new Map()

  MOCK_PARTICIPATIONS.forEach((participation) => {
    const opportunity = MOCK_OPPORTUNITIES.find((item) => item.id === participation.opportunityId)
    const categoryId = opportunity?.category?.id
    if (!categoryId) return

    const entry = history.get(categoryId) || { total: 0, accepted: 0, rejected: 0 }
    entry.total += 1
    if (participation.status === PARTICIPATION_STATUS.ACCEPTED) entry.accepted += 1
    if (participation.status === PARTICIPATION_STATUS.REJECTED) entry.rejected += 1
    history.set(categoryId, entry)
  })

  return history
}

/**
 * يحسب نقاط تطابق فرصة معيّنة مع متطوع معيّن، وبيرجّع كمان أقوى سبب
 * تطابق كجملة مبسّطة (مش رقم خام) — نفس أسلوب LinkedIn/Netflix: سبب
 * واحد بس، الأقوى، مش قائمة كل الأسباب مع بعض (بيصير مزدحم بصريًا).
 * @param {object} opportunity
 * @param {{skillIds: string[], skillNames: Map<string,string>, city: string, categoryHistory: Map}} params
 * @returns {{score: number, reason: string|null}}
 */
function computeMatchScore(opportunity, { skillIds, skillNames, city, categoryHistory }) {
  // كل سبب محتمل مع وزنه — نفس الأوزان المستخدمة بحساب score تمامًا،
  // حتى "أقوى سبب" المعروض للمستخدم يطابق فعليًا أقوى عامل بالحساب
  const reasons = []

  const opportunitySkills = Array.isArray(opportunity.skills) ? opportunity.skills : []
  // نحسب عدد المهارات المشتركة مرة واحدة فقط، ونعيد استخدام نفس القيمة
  // لكل من نص السبب المعروض وحساب الـ score (بدل حساب .filter() مرتين)
  const matchingSkillsCount = opportunitySkills.filter((skill) => skillIds.includes(skill.id)).length
  const matchingSkill = opportunitySkills.find((skill) => skillIds.includes(skill.id))
  if (matchingSkill) {
    reasons.push({
      weight: matchingSkillsCount * 3,
      text: `Matches your ${skillNames.get(matchingSkill.id) || matchingSkill.name} skill`,
    })
  }

  const categoryId = opportunity.category?.id
  const history = categoryId ? categoryHistory.get(categoryId) : null
  let historyScore = 0
  if (history) {
    if (history.total > 0) historyScore += 1
    if (history.accepted > 0) {
      historyScore += 2
      reasons.push({ weight: 2, text: "You've succeeded in similar opportunities before" })
    } else if (history.total > 0) {
      reasons.push({ weight: 1, text: "Matches your past interests" })
    }
    if (history.rejected > 0) historyScore -= 1
  }

  const isSameCity = Boolean(
    city && opportunity.location?.toLowerCase().includes(city.trim().toLowerCase()),
  )
  if (isSameCity) {
    reasons.push({ weight: 2, text: 'Near your city' })
  }

  const score = matchingSkillsCount * 3 + (isSameCity ? 2 : 0) + historyScore

  // أقوى سبب بس (أعلى وزن) — لو تعادل وزنين، أول واحد انضاف (المهارة
  // دايمًا بتنضاف أول لو موجودة، فهي الأولوية بالتعادل تلقائيًا)
  reasons.sort((a, b) => b.weight - a.weight)

  return { score, reason: reasons[0]?.text || null }
}

/**
 * يجلب الفرص المكتملة بنجاح فقط (وصلت للعدد الكامل من المتطوعين
 * وانتهت فعليًا) — تُستخدم بسكشن "Success Stories" بالصفحة الرئيسية.
 *
 * TODO: لما يجهز endpoint الباك، ممكن يصير فلتر status=closed مباشرة
 * من السيرفر بدل الفلترة هون، بدون ما تتغيّر واجهة الدالة.
 */
export async function fetchCompletedOpportunities() {
  if (MOCK_MODE) {
    await wait()
    // status===COMPLETED لحاله بيعني بس "فات تاريخ الانتهاء" — ممكن فرصة
    // تنتهي بعدد متطوعين قليل جدًا أو حتى صفر وتضل تُحسب COMPLETED. هون
    // تحديدًا (Success Stories) لازم فلتر أقوى: isSuccessfulOpportunity
    // بتتأكد كمان إنها وصلت فعليًا لعدد المتطوعين الأدنى المطلوب
    // (minVolunteers) قبل ما تنتهي — راجع utils/opportunityStatus.js
    // ⚠️ لازم Arrow Function هون، مش تمرير isSuccessfulOpportunity مباشرة:
    // Array.filter بيستدعي الـ callback بـ(item, index, array)، فلو مرّرناها
    // مباشرة كـ .filter(isSuccessfulOpportunity)، الـ index (رقم صغير 0،1،2...)
    // كان عم يتمرّر كوسيط "now" (بدل ما يضل افتراضي = new Date())، وبالتالي
    // مقارنة التواريخ جوا getEffectiveOpportunityStatus كانت دايمًا غلط
    // (رقم صغير مقابل Date كامل)، فـ COMPLETED ما كانت توصلها أي فرصة أبدًا
    // ورجعت [] دايمًا — بغض النظر عن أي بيانات Mock موجودة فعليًا
    return MOCK_OPPORTUNITIES.map(attachComputedStatus).filter((opportunity) => isSuccessfulOpportunity(opportunity))
  }

  try {
    const response = await apiClient.get('/opportunities', {
      params: { status: OPPORTUNITY_STATUS.COMPLETED },
    })
    return response.data || []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load completed opportunities'))
  }
}

/**
 * Fetches opportunities, optionally filtered.
 * @param {{search?:string, categoryId?:string, skillId?:string, location?:string}} filters
 */
export async function fetchOpportunities(filters = {}) {
  if (MOCK_MODE) {
    await wait()
    return MOCK_OPPORTUNITIES.filter((opportunity) => matchesFilters(opportunity, filters)).map(
      attachComputedStatus,
    )
  }

  try {
    const response = await apiClient.get('/opportunities', { params: filters })
    const data = Array.isArray(response.data) ? response.data : []
    // نفس التطبيع المطبَّق على fetchSuggestedOpportunities وfetchOpportunityDetails
    // — بدون هالخطوة ممكن تختلف بنية organization بين نقاط النهاية المختلفة
    // بالباك اند، وتنكسر أي Component بيعتمد على شكل موحّد لبيانات المنظمة
    return data.map((item) => ({
      ...item,
      organization: normalizeOpportunityOrganization(item.organization),
    }))
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load opportunities'))
  }
}

/**
 * يجلب الفرص المصنّفة "مناسبة" للمتطوع الحالي حسب الخوارزمية — بناءً
 * على معلومات بروفايله الثابتة (مهاراته ومدينته حاليًا) فقط، مو فلترة
 * يدوية أو تصنيف بشري.
 *
 * قرار مؤكد: الخوارزمية تعتمد فقط على بيانات البروفايل الموجودة أصلًا
 * (سنا أكدت هيك) — ما في تتبع سلوك أو تفاعل (زي عدد فتحات فرصة معينة
 * أو الفئات الأكثر تصفحًا)، فما في داعي نضيف أي كود لإرسال أحداث
 * تفاعل من الفرونت مستقبلًا.
 *
 * TODO: لما يجهز endpoint الباك الحقيقي (اقتراح الفرص عبر الخوارزمية)،
 * نستبدل منطق الـ MOCK هون بس، بدون ما نلمس أي Component يستخدمها.
 * شكل الـ Response النهائي (وهل فيه matching score) لسا بانتظار تأكيد الباك.
 *
 * @param {{skillIds?: string[], city?: string}} volunteer
 */
export async function fetchSuggestedOpportunities({ skillIds = [], city = '' } = {}) {
  if (MOCK_MODE) {
    await wait()
    const categoryHistory = buildCategoryHistory()
    // لبناء جملة "Matches your X skill" محتاجين اسم المهارة، مش بس ID
    const allSkills = await fetchAvailableSkills()
    const skillNames = new Map(allSkills.map((skill) => [skill.id, skill.name]))

    return MOCK_OPPORTUNITIES.map((opportunity) => ({
      opportunity,
      ...computeMatchScore(opportunity, { skillIds, skillNames, city, categoryHistory }),
    }))
      // بس الفرص يلي إلها تطابق حقيقي (نقاط > 0) — مش أي فرصة بالمنصة.
      // نقطة أدنى منطقية بدل عرض كل شي مرتّب بس بدون أي حد أدنى للصلة
      .filter(({ score }) => score > 0)
      // من الأعلى تطابقًا للأقل — عكس الفلترة الثنائية القديمة يلي كانت
      // تُظهر أو تُخفي الفرصة بالكامل بدون أي تدرّج بينهم
      .sort((a, b) => b.score - a.score)
      .map(({ opportunity, reason }) => ({ ...attachComputedStatus(opportunity), matchReason: reason }))
  }

  try {
    const response = await apiClient.get('/volunteers/me/suggested-opportunities')
    const data = Array.isArray(response.data) ? response.data : []

    // ⚠️ تطبيع دفاعي نهائي — بغض النظر شو بالضبط رح يرجّع الباك اند
    // (سبب نصي جاهز، احتمال رقمي بس زي خوارزمية Naive Bayes، أو ولا
    // شي إطلاقًا)، هالسطر بيضمن إنه الشاشة تشتغل صح بكل الحالات
    // بدون أي حاجة لتعديل لاحق:
    //   - أسماء حقول شائعة محتملة للسبب (match_reason/reason/explanation)
    //     تُقرأ تلقائيًا لو وُجدت.
    //   - لو رجع احتمال رقمي بس (probability/score) بدون نص، نولّد
    //     جملة عامة منه ("Strong match" فوق 70%، وإلا "Recommended
    //     for you") بدل ما نعرض رقم خام مالوش معنى للمستخدم.
    //   - لو ما رجع ولا شي من هيك، matchReason بتضل null، وواجهة
    //     "Suggested" أصلًا عندها Fallback جاهز ("Recommended for
    //     you") بمكان التجميع — الشاشة ما بتنكسر بأي سيناريو.
    return data.map((item) => {
      const explicitReason = item.matchReason || item.match_reason || item.reason || item.explanation || null

      const probability = typeof item.probability === 'number' ? item.probability
        : typeof item.score === 'number' && item.score <= 1 ? item.score
        : null

      const derivedReason = explicitReason
        || (probability != null ? (probability >= 0.7 ? 'Strong match for you' : 'Recommended for you') : null)

      return {
        ...attachComputedStatus(item),
        organization: normalizeOpportunityOrganization(item.organization),
        matchReason: derivedReason,
      }
    })
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load suggested opportunities'))
  }
}

/**
 * Fetches a single opportunity by id, along with a short list of similar
 * opportunities (same category, excluding itself) for the details sidebar.
 */
export async function fetchOpportunityById(id) {
  if (MOCK_MODE) {
    await wait()
    const opportunity = MOCK_OPPORTUNITIES.find((item) => item.id === id) || null
    const similar = opportunity
      ? MOCK_OPPORTUNITIES.filter(
          (item) => item.id !== id && item.category?.id === opportunity.category?.id,
        ).slice(0, 3)
      : []

    return {
      opportunity: attachComputedStatus(opportunity),
      similar: similar.map(attachComputedStatus),
    }
  }

  try {
    const response = await apiClient.get(`/opportunities/${id}`)
    const data = response.data || {}

    // ⚠️ نفس شكل استجابة Mock بالأعلى بالضبط: { opportunity, similar }
    // — لو الباك اند الحقيقي رجّع شكل مختلف لما يُبنى فعليًا (Controller
    // لسا فاضي كليًا حاليًا)، هون بالضبط المكان الوحيد يلي لازم يتعدّل
    return {
      opportunity: data.opportunity
        ? { ...data.opportunity, organization: normalizeOpportunityOrganization(data.opportunity.organization) }
        : null,
      similar: Array.isArray(data.similar)
        ? data.similar.map((item) => ({
            ...item,
            organization: normalizeOpportunityOrganization(item.organization),
          }))
        : [],
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load opportunity details'))
  }
}

/**
 * يجلب الفرص الخاصة بالمنظمة المسجّلة دخولها حاليًا (لصفحة "My Causes").
 * ملاحظة Mock: نرجع كل قائمة الفرص التجريبية كأنها فرص نفس المنظمة، بما إنه
 * حساب Mock واحد بس متاح للتجربة حاليًا — سيُستبدل بفلترة حقيقية حسب
 * organization_id لما يجهز GET /organizations/me/opportunities.
 */
export async function fetchMyOpportunities() {
  if (MOCK_MODE) {
    await wait()
    return MOCK_OPPORTUNITIES.filter(
      (opportunity) => opportunity.organization?.id === MOCK_MY_ORGANIZATION_ID,
    ).map(attachComputedStatus)
  }

  try {
    const response = await apiClient.get('/organizations/me/opportunities')
    return response.data || []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load your causes'))
  }
}

/**
 * يختلف عن fetchMyOpportunities لأنه يقبل أي organizationId (مو بس
 * صاحبة الجلسة الحالية) — لعرض بروفايل أي منظمة من الخارج.
 *
 * ⚠️ الباك اند الحقيقي ما عنده endpoint فرص مفعّل إطلاقًا لسا (راجع
 * OpportunityController — كل الدوال فاضية بدون أي implementation). لما
 * يجهز، رح يشتغل مباشرة عبر ?organization_id= بدون أي تعديل هون.
 *
 * يجلب كل فرص منظمة معيّنة، بكل الحالات (بدون فلترة على registration_open) —
 * صفحة بروفايل المنظمة (OrganizationDetailsPage.jsx) هي يلي بتقسمهم
 * بصريًا لـ "Open Now" و"Past Opportunities"، مش الخدمة. قرار: زائر
 * بروفايل منظمة بده يشوف سجلها الكامل (نشط + منتهي)، بعكس صفحة
 * الاستكشاف العامة يلي بتعرض registration_open بس.
 * @param {string} organizationId
 */
export async function fetchOpportunitiesByOrganization(organizationId) {
  if (MOCK_MODE) {
    await wait()
    return MOCK_OPPORTUNITIES.map(attachComputedStatus).filter(
      (opportunity) => opportunity.organization?.id === organizationId,
    )
  }

  try {
    const response = await apiClient.get('/opportunities', {
      params: { organization_id: organizationId },
    })
    return response.data || []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load this organization\'s opportunities'), { cause: error })
  }
}

/**
 * يحذف فرصة تنشرها المنظمة (بعد تأكيد المستخدم).
 */
export async function deleteOpportunity(id) {
  if (MOCK_MODE) {
    await wait()
    // splice بالمكان بدل إعادة تعيين MOCK_OPPORTUNITIES بالكامل: هي
    // مستوردة هلق من mockOpportunitiesStore.js (named import) — وnamed
    // imports ثابتة (read-only binding) بوضع ES Modules، ما بينعاد
    // تعيينها من ملف تاني غير يلي عرّفها، فقط تعديل محتواها بالمكان
    const index = MOCK_OPPORTUNITIES.findIndex((item) => item.id === id)
    if (index !== -1) MOCK_OPPORTUNITIES.splice(index, 1)
    return { success: true }
  }

  try {
    await apiClient.delete(`/opportunities/${id}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to delete this cause') }
  }
}
/**
 * ينشئ فرصة جديدة (من طرف المنظمة).
 */
export async function createOpportunity({ imageFile, ...payload }) {
  if (MOCK_MODE) {
    await wait()
    const newOpportunity = {
      ...payload,
      id: `o${Date.now()}`,
      registrationClosedManually: false,
      currentVolunteers: 0,
      organization: { id: MOCK_MY_ORGANIZATION_ID, name: 'My Organization', phone: '+31600000000', imageUrl: null },
      image: imageFile ? URL.createObjectURL(imageFile) : null,
    }
    // تُضاف مباشرة لنفس المصدر الموحّد، فتظهر فورًا بصفحة التصفح العامة
    // للمتطوعين تمامًا كما ستظهر بـ "My Causes" — بلا أي فرق بينهما
    MOCK_OPPORTUNITIES.unshift(newOpportunity)
    return { success: true, data: attachComputedStatus(newOpportunity) }
  }

  try {
    const formData = buildOpportunityFormData(payload, imageFile)
    const response = await apiClient.post('/opportunities', formData)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to create this cause') }
  }
}

/**
 * يعدّل فرصة موجودة (من طرف المنظمة).
 */
export async function updateOpportunity(id, { imageFile, ...payload }) {
  if (MOCK_MODE) {
    await wait()
    const index = MOCK_OPPORTUNITIES.findIndex((item) => item.id === id)
    if (index !== -1) {
      MOCK_OPPORTUNITIES[index] = {
        ...MOCK_OPPORTUNITIES[index],
        ...payload,
        image: imageFile ? URL.createObjectURL(imageFile) : MOCK_OPPORTUNITIES[index].image,
      }
    }
    return { success: true, data: attachComputedStatus(MOCK_OPPORTUNITIES[index]) }
  }

  try {
    const formData = buildOpportunityFormData(payload, imageFile)
    formData.append('_method', 'PUT')
    const response = await apiClient.post(`/opportunities/${id}`, formData)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to update this cause') }
  }
}

/**
 * Registers the current volunteer's participation in an opportunity.
 * Maps to the "participates" relation (volunteer <-> opportunity).
 * @param {string} id
 * @param {number} committedHours - عدد الساعات يلي حدّده المتطوع بنفسه
 *   وقت التسجيل، لازم يكون جوا نطاق [minHours, maxHours] تبع هاي الفرصة
 */
export async function participateInOpportunity(id, committedHours) {
  if (MOCK_MODE) {
    await wait()

    const opportunity = MOCK_OPPORTUNITIES.find((item) => item.id === id)
    if (!opportunity) return { success: false, error: 'Opportunity not found' }

    // ما منسمح بالانضمام إلا لما التسجيل فعليًا مفتوح (مو ممتلئة، ومو
    // متجاوزة نافذة التسجيل، ومو مغلقة يدويًا) — الحالة محسوبة تلقائيًا
    // ⚠️ لازم نستخدم العدد الحيّ (مش opportunity.currentVolunteers الخام
    // من المخزن — صار مجمّدًا دايمًا على قيمة البذرة الأولية بعد ما شلنا
    // الزيادة اليدوية فوق) وإلا فرصة امتلأت فعليًا بعد التسجيل ممكن تضل
    // تقبل متطوعين جدد بالغلط، أو العكس
    const liveOpportunity = { ...opportunity, currentVolunteers: computeLiveCurrentVolunteers(opportunity.id) }
    if (getEffectiveOpportunityStatus(liveOpportunity) !== OPPORTUNITY_STATUS.REGISTRATION_OPEN) {
      return { success: false, error: 'Registration is no longer open for this opportunity' }
    }

    // تحقق من عدد الساعات — لازم يكون *جوا* نطاق الفرصة بالكامل
    // [minHours, maxHours]، مش بس أكبر من الحد الأدنى. نفس القاعدة
    // لازم تتأكد بالباك اند الحقيقي كمان (الفرونت خط دفاع أول بس)
    const hours = Number(committedHours)
    if (!Number.isFinite(hours) || hours < opportunity.minHours || hours > opportunity.maxHours) {
      return {
        success: false,
        error: `Please commit to a number between ${opportunity.minHours} and ${opportunity.maxHours} hours.`,
      }
    }

    // ⚠️ ما عاد لازم نزيد currentVolunteers يدويًا هون — أصبحت محسوبة
    // تلقائيًا من عدد المشاركات الفعلية بـ attachComputedStatus (راجع
    // أعلى الملف)، فبمجرد ما نضيف المشاركة تحت، الرقم بينعكس صح تلقائيًا
    // بكل نقطة قراءة — بما فيها الانسحاب والرفض لاحقًا، بدون أي كود إضافي

    // نربط الانضمام هون فعليًا بقائمة المتقدمين يلي بتشوفها المنظمة —
    // بدون هالخطوة كان المتطوع بيزيد بعداد "X/Y volunteers joined" بس
    // بدون ما يظهر إطلاقًا بصفحة applicants (فجوة Mock سابقة بين
    // opportunities.js وparticipations.js، راجع mockParticipationsStore.js)
    const email = getCurrentSessionEmail()
    const mockUser = email ? loadMockUsers().find((user) => user.email === email) : null

    // ⚠️ فجوة كانت موجودة هون: ما كان في أي تحقق من وجود مشاركة سابقة لنفس
    // المتطوع على نفس الفرصة قبل النداء على addMockParticipation، فكل
    // ضغطة "Join" إضافية كانت تضيف سطر مشاركة جديد بدل ما تُرفض. وبما إن
    // currentVolunteers بيتحسب لحظيًا من عدد سطور pending/accepted فقط
    // (راجع computeLiveCurrentVolunteers فوق)، كل طلب مكرر كان يزيد
    // العداد بالغلط ويقرّب الفرصة من الامتلاء (registration_closed) دون
    // أي متطوعين إضافيين حقيقيين. withdrawn وrejected حالتان نهائيتان
    // بالتصميم (راجع constants/participationStatus.js)، فمنطقيًا نسمح
    // بإعادة التقديم بعدهما — مش تكرار فعلي لطلب لسا قائم.
    if (email) {
      const hasActiveParticipation = MOCK_PARTICIPATIONS.some(
        (participation) =>
          participation.opportunityId === id &&
          participation.volunteerProfile?.email === email &&
          participation.status !== PARTICIPATION_STATUS.WITHDRAWN &&
          participation.status !== PARTICIPATION_STATUS.REJECTED,
      )
      if (hasActiveParticipation) {
        return { success: false, error: 'You have already applied to this opportunity' }
      }
    }

    if (mockUser) {
      // skillIds مخزّنة بالبروفايل (مو أسماء) — لازم نحوّلها لأسماء
      // حقيقية قبل ما تنعرض ببطاقة المتقدم عند المنظمة
      const allSkills = await fetchAvailableSkills()
      const skillNames = (mockUser.skillIds || [])
        .map((skillId) => allSkills.find((skill) => skill.id === skillId)?.name)
        .filter(Boolean)

      addMockParticipation({
        opportunityId: id,
        committedHours: hours,
        volunteerProfile: {
          email,
          name: [mockUser.firstName, mockUser.lastName].filter(Boolean).join(' ') || 'A volunteer',
          photo: mockUser.imageUrl || null,
          city: mockUser.city || '',
          skills: skillNames,
          phone: mockUser.phone || '',
          educationLevel: mockUser.educationLevel || '',
          dateOfBirth: mockUser.dateOfBirth || null,
          gender: mockUser.gender || '',
        },
      })
    }

    return { success: true }
  }

  try {
    await apiClient.post(`/opportunities/${id}/participate`, { committed_hours: committedHours })
    return { success: true }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to join opportunity') }
  }
}

/**
 * تبديل حالة الفرصة يدويًا (إغلاق/إعادة فتح) من طرف المنظمة —
 * منفصل تمامًا عن الإغلاق التلقائي أعلاه: يعمل بغض النظر عن نسبة الامتلاء.
 * مثال استخدام: إغلاق فرصة مبكرًا رغم عدم اكتمال العدد، أو إعادة فتحها
 * لاحقًا لو انسحب بعض المتطوعين.
 */
export async function setOpportunityStatus(id, status) {
  if (MOCK_MODE) {
    await wait()
    const index = MOCK_OPPORTUNITIES.findIndex((item) => item.id === id)
    if (index === -1) return { success: false, error: 'Opportunity not found' }

    // هالتبديل اليدوي مسموح بس بين "تسجيل مفتوح" و"تسجيل منتهي" (قبل ما
    // تبدأ الفرصة) — بنضبط علم registrationClosedManually فقط، والحالة
    // النهائية المعروضة بتنحسب دايمًا عبر attachComputedStatus
    MOCK_OPPORTUNITIES[index] = {
      ...MOCK_OPPORTUNITIES[index],
      registrationClosedManually: status === OPPORTUNITY_STATUS.REGISTRATION_CLOSED,
    }
    return { success: true, data: attachComputedStatus(MOCK_OPPORTUNITIES[index]) }
  }

  try {
    const response = await apiClient.patch(`/opportunities/${id}/status`, { status })
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to update cause status') }
  }
}