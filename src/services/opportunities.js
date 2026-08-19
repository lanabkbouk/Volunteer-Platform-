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
import { getGovernorateBySelectValue, getGovernorateSelectValue } from './syrianGovernorates'
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
  // registrationClosedReason ('organization' | 'city_deactivated' | null)
  // بينتقل تلقائيًا هون عبر الـ spread فوق (...withLiveCount بيحمل كل
  // حقول opportunity الخام بما فيها هالحقل) — مافي داعي لسطر إضافي يعيد
  // نسخه صراحة، بس هيك الواجهة (OpportunityDetailsPage.jsx مثلًا) دايمًا
  // توصلها القيمة الصحيحة بكائن الفرصة النهائي المُرجَع
  return { ...withLiveCount, status: getEffectiveOpportunityStatus(withLiveCount) }
}

// يطبّع اسم حقل تاريخ الإنشاء القادم من الباك اند الحقيقي (على الأغلب
// created_at بصيغة Laravel الافتراضية snake_case) إلى createdAt camelCase
// الموحّد — نفس فلسفة normalizeOpportunityOrganization تمامًا (أعلاه)،
// بمكان واحد بدل ما كل نقطة استجابة/validation تتعامل مع اسمين مختلفين
// لنفس الحقل
function normalizeOpportunityCreatedAt(item) {
  if (!item) return item
  return { ...item, createdAt: item.createdAt ?? item.created_at ?? null }
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

// ⚠️ حساب تقريبي مبسّط بوضع mock فقط للعرض التجريبي — بيحاكي مدخلات
// خوارزمية الباك اند الحقيقية (Naive Bayes على المهارات والمدينة فقط،
// خصائص مستقلة احتماليًا عن بعضها) من دون تطبيق نفس الحساب الاحتمالي
// الفعلي. سيُستبدل بالكامل باستدعاء /volunteers/me/suggested-opportunities
// الحقيقي فور جاهزيته (راجع فرع الـ API الحقيقي بـ fetchSuggestedOpportunities
// تحت). ⚠️ لا تُضيفي أي إشارة تالتة (متل تاريخ التصنيفات/المشاركات
// السابقة) — الباك اند الفعلي بيعتمد بس على مهارات + مدينة، ولا وجود
// لإشارة "تاريخ المشاركات" بمواصفاته إطلاقًا
/**
 * يحسب نقاط تطابق فرصة معيّنة مع متطوع معيّن، وبيرجّع كمان أقوى سبب
 * تطابق كجملة مبسّطة (مش رقم خام) — نفس أسلوب LinkedIn/Netflix: سبب
 * واحد بس، الأقوى، مش قائمة كل الأسباب مع بعض (بيصير مزدحم بصريًا).
 * @param {object} opportunity
 * @param {{skillIds: string[], skillNames: Map<string,string>, city: string}} params
 * @returns {{score: number, reason: string|null}}
 */
function computeMatchScore(opportunity, { skillIds, skillNames, city }) {
  const reasons = []

  const opportunitySkills = Array.isArray(opportunity.skills) ? opportunity.skills : []
  const matchingSkillsCount = opportunitySkills.filter((skill) => skillIds.includes(skill.id)).length
  const matchingSkill = opportunitySkills.find((skill) => skillIds.includes(skill.id))
  if (matchingSkill) {
    reasons.push({
      weight: matchingSkillsCount * 3,
      text: `Matches your ${skillNames.get(matchingSkill.id) || matchingSkill.name} skill`,
    })
  }

  const isSameCity = Boolean(
    city && opportunity.location?.toLowerCase().includes(city.trim().toLowerCase()),
  )
  if (isSameCity) {
    reasons.push({ weight: 2, text: 'Near your city' })
  }

  const score = matchingSkillsCount * 3 + (isSameCity ? 2 : 0)

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
    throw new Error(getApiErrorMessage(error, 'Failed to load completed opportunities'), { cause: error })
  }
}

/**
 * Fetches opportunities, optionally filtered.
 * @param {{search?:string, categoryId?:string, skillId?:string, location?:string}} filters
 */
export async function fetchOpportunities(filters = {}) {
  if (MOCK_MODE) {
    await wait()
    // ترتيب افتراضي تصاعديًا حسب registerEndAt (الأقرب لانتهاء نافذة
    // التسجيل أول) — من مصدر البيانات نفسه لا بس من المكوّن المستهلك
    // (OpportunitiesListPage.jsx)، تفاديًا لازدواجية نفس منطق الترتيب
    // لو الدالة استُخدمت مستقبلًا بمكان تاني غير صفحة تصفح الفرص
    return MOCK_OPPORTUNITIES.filter((opportunity) => matchesFilters(opportunity, filters))
      .map(attachComputedStatus)
      .sort((a, b) => new Date(a.registerEndAt) - new Date(b.registerEndAt))
  }

  try {
    // TODO: لو الباك اند الحقيقي ما بيرجّع الفرص مرتّبة أصلًا حسب
    // register_end_at، لازم تمرير معامل ترتيب صريح بالطلب هون (مثلًا
    // params: { ...filters, sort: 'register_end_at' }) عند توفر الـ
    // endpoint الحقيقي — نفس ترتيب فرع mock فوق بالضبط
    const response = await apiClient.get('/opportunities', { params: filters })
    const data = Array.isArray(response.data) ? response.data : []
    // بدون هالخطوة ممكن تختلف بنية organization بين نقاط النهاية المختلفة
    // بالباك اند، وتنكسر أي Component بيعتمد على شكل موحّد لبيانات المنظمة
    return data.map((item) => ({
      ...normalizeOpportunityCreatedAt(item),
      organization: normalizeOpportunityOrganization(item.organization),
    }))
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load opportunities'), { cause: error })
  }
}

/**
 * يجلب الفرص المصنّفة "مناسبة" للمتطوع الحالي حسب الخوارزمية — بناءً
 * على معلومات بروفايله الثابتة (مهاراته ومدينته حاليًا) فقط، مو فلترة
 * يدوية أو تصنيف بشري.
 *
 * قرار مؤكد: الخوارزمية تعتمد فقط على بيانات البروفايل الموجودة أصلًا
 * (نا أكدت هيك) — ما في تتبع سلوك أو تفاعل (زي عدد فتحات فرصة معينة
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
    // لبناء جملة "Matches your X skill" محتاجين اسم المهارة، مش بس ID
    const allSkills = await fetchAvailableSkills()
    const skillNames = new Map(allSkills.map((skill) => [skill.id, skill.name]))

    return MOCK_OPPORTUNITIES.map((opportunity) => ({
      opportunity,
      ...computeMatchScore(opportunity, { skillIds, skillNames, city }),
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
    throw new Error(getApiErrorMessage(error, 'Failed to load suggested opportunities'), { cause: error })
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
        ? {
            ...normalizeOpportunityCreatedAt(data.opportunity),
            organization: normalizeOpportunityOrganization(data.opportunity.organization),
          }
        : null,
      similar: Array.isArray(data.similar)
        ? data.similar.map((item) => ({
            ...normalizeOpportunityCreatedAt(item),
            organization: normalizeOpportunityOrganization(item.organization),
          }))
        : [],
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load opportunity details'), { cause: error })
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
    throw new Error(getApiErrorMessage(error, 'Failed to load your causes'), { cause: error })
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
  // تحقق دفاعي مشترك بين وضعي mock وreal API: الفورم (CauseForm.jsx) أصلًا
  // بيعرض محافظة معطّلة كخيار disabled غير قابل للاختيار (راجع دعم
  // item.disabled بـ ui/Dropdown.jsx)، فهاد فقط خط دفاع ثانٍ ضد استدعاء
  // مباشر للدالة بـ city معطّلة (تجاوز الفورم)
  const selectedCityValue = payload.location ?? payload.city
  const selectedGovernorate = selectedCityValue ? getGovernorateBySelectValue(selectedCityValue) : null
  if (selectedGovernorate && selectedGovernorate.isActive === false) {
    return { success: false, error: 'This governorate is no longer served by the platform.' }
  }

  if (MOCK_MODE) {
    await wait()

    // ⚠️ كانت هون قيمة ثابتة "My Organization" بدل اسم المنظمة الحقيقية
    // المسجّلة دخولها — أي فرصة تنشئها أي منظمة (بغض النظر عن اسمها
    // الفعلي) كانت تظهر بنفس الاسم العام هذا لكل المتطوعين. نجيب بيانات
    // المنظمة الحقيقية من نفس الجلسة، بنفس نمط fetchOrganizationProfile
    // بـ services/organization.js (getCurrentSessionEmail + loadMockUsers).
    // id يبقى MOCK_MY_ORGANIZATION_ID الثابت (مش mockUser.organizationId)
    // عمدًا — fetchMyOpportunities/fetchOpportunitiesByOrganization تحته
    // بالفلترة، وتغييره هون كان رح يكسرهم بدون داعٍ لإصلاح مشكلة الاسم فقط
    const email = getCurrentSessionEmail()
    const mockUser = email ? loadMockUsers().find((user) => user.email === email) : null

    const newOpportunity = {
      ...payload,
      id: `o${Date.now()}`,
      // لحظة الإنشاء الفعلية الثابتة — تُستخدم لاحقًا بتحقق startDate/
      // registerStartAt (opportunityValidation.js) عند فتح شاشة التعديل
      // لهاي الفرصة تحديدًا، فلازم تُخزَّن مرة وحدة هون ولا تتغيّر أبدًا
      createdAt: new Date().toISOString(),
      registrationClosedManually: false,
      registrationClosedReason: null,
      currentVolunteers: 0,
      organization: {
        id: MOCK_MY_ORGANIZATION_ID,
        name: mockUser?.orgName || 'My Organization',
        phone: mockUser?.phone || '+31600000000',
        imageUrl: mockUser?.imageUrl || null,
      },
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
      // ⚠️ عمدًا ما منمرّر createdAt جوا payload هون ولا نعيد كتابتها —
      // بتضل ثابتة على قيمتها الأصلية (لحظة الإنشاء الحقيقية) طول عمر
      // الفرصة حتى بعد أي تعديل لاحق، فتحقق startDate/registerStartAt
      // بمرات التعديل القادمة يضل يقارن بنفس المرجع الصحيح دايمًا
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
    // النهائية المعروضة بتنحسب دايمًا عبر attachComputedStatus.
    // registrationClosedReason: 'organization' لما تُغلق من هون تحديدًا
    // (تمييزها عن إغلاق تلقائي بسبب تعطيل محافظة — راجع
    // closeCityOpportunitiesRegistration تحت)، وترجع null دايمًا عند
    // إعادة الفتح بغض النظر شو كان السبب السابق
    const isClosing = status === OPPORTUNITY_STATUS.REGISTRATION_CLOSED
    MOCK_OPPORTUNITIES[index] = {
      ...MOCK_OPPORTUNITIES[index],
      registrationClosedManually: isClosing,
      registrationClosedReason: isClosing ? 'organization' : null,
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

/**
 * يغلق تسجيل كل الفرص المفتوحة فعليًا (REGISTRATION_OPEN تحديدًا) بمحافظة
 * معيّنة — تُستدعى من toggleGovernorateStatus (services/syrianGovernorates.js)
 * لحظة تعطيل محافظة. إغلاق تسجيل عادي (نفس آلية setOpportunityStatus
 * أعلاه، بس تلقائي وبالجملة)، وليس إلغاء فرصة: الفرصة تبقى موجودة وقابلة
 * للعرض والتصفّح، بس ما تعود تقبل متطوعين جدد. لا تلمس أي فرصة
 * IN_PROGRESS أو COMPLETED (اشتغلت أو خلصت فعلًا)، ولا فرصة
 * REGISTRATION_CLOSED أصلًا لسبب تاني (إغلاق يدوي من المنظمة أو امتلأت
 * العدد) — فقط اللي كانت REGISTRATION_OPEN تحديدًا لحظة التعطيل.
 *
 * ⚠️ إعادة تفعيل المحافظة لاحقًا (toggleGovernorateStatus بـ isActive:
 * true) عمدًا ما بتعيد فتح هالفرص تلقائيًا — قرار نهائي ومقصود، مش Bug.
 * لو المنظمة حابة تفتح تسجيل فرصتها من جديد بعد إعادة تفعيل محافظتها،
 * تقدر تفتحه يدويًا بنفس زر القفل/الفتح (setOpportunityStatus) متل أي
 * فرصة تانية — القرار برجع لها، مش تلقائي.
 * @param {string} cityNameEn - الاسم الإنجليزي الخام للمحافظة (nameEn)
 */
export function closeCityOpportunitiesRegistration(cityNameEn) {
  const cityValue = getGovernorateSelectValue(cityNameEn)

  MOCK_OPPORTUNITIES.forEach((opportunity) => {
    if (opportunity.location !== cityValue) return
    if (getEffectiveOpportunityStatus(opportunity) !== OPPORTUNITY_STATUS.REGISTRATION_OPEN) return

    opportunity.registrationClosedManually = true
    opportunity.registrationClosedReason = 'city_deactivated'
  })
}